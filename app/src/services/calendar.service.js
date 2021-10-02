import executeSQL from '../utils/executeSQL';
import moment from 'moment';
import {NoteAction, NoteMode, NoteRepeatType} from "../constants";
import {convertLocalDateTimeToUTC, convertUTCDateTimeToLocal} from "../utils/convertDateTimeLocale";

class CalendarService {
    checkForCountUpdate(nextDate, intervalStartDate, intervalEndDate) {
        return !intervalStartDate || !intervalEndDate || nextDate >= intervalEndDate || nextDate <= intervalStartDate
    }

    async getCount(date, period, noteFilters) {
        let halfInterval = period === "month" ? 10 : 10;

        let msIntervalStartDate = moment(date).subtract(halfInterval, period).startOf(period).valueOf();
        let msIntervalEndDate = moment(date).add(halfInterval, period).endOf(period).valueOf();
        let msIntervalStartDateUTC = convertLocalDateTimeToUTC(msIntervalStartDate).valueOf();
        let msIntervalEndDateUTC = convertLocalDateTimeToUTC(msIntervalEndDate).valueOf();

        let select = await executeSQL(`
            SELECT n.date, n.repeatType, n.repeatItemDate, rep.value as repeatValue, n.isFinished, n.tags
            FROM Notes n
            LEFT JOIN NotesRepeatValues rep ON n.id = rep.noteId
            WHERE
                n.lastAction != ? 
                AND (
                    ((n.repeatType = ? OR n.forkFrom IS NOT NULL) AND n.date >= ? AND n.date <= ?)
                    OR (n.forkFrom IS NULL AND n.repeatType IN (?, ?, ?))
                )
                AND n.mode = ?;
        `, [NoteAction.Delete, NoteRepeatType.NoRepeat, msIntervalStartDateUTC, msIntervalEndDateUTC, NoteRepeatType.Day, NoteRepeatType.Week, NoteRepeatType.Any, NoteMode.WithDateTime]);

        let dates = {};
        let dateInitial = {
            finished: 0,
            notFinished: 0
        };
        for (let date = moment(msIntervalStartDate); moment(msIntervalEndDate).isSameOrAfter(date); date = moment(date).add(1, 'day').startOf("day")) {
            dates[date.valueOf()] = {...dateInitial};
        }

        let repeatableDay = 0;
        let repeatableWeek = {};

        for (let i = 0; i < select.rows.length; i++) {
            let note = select.rows.item(i);

            if (
                noteFilters.tags.length
                && (note.tags ? note.tags.split(",").map(Number) : []).filter((tagId) => noteFilters.tags.filter((_tagId) => _tagId === tagId).length !== 0).length === 0
            ) {
                continue;
            }

            if (note.date) {
                note.date = convertUTCDateTimeToLocal(note.date).valueOf();
            }
            if (note.repeatItemDate) {
                note.repeatItemDate = convertUTCDateTimeToLocal(note.repeatItemDate).valueOf();
            }
            if (note.repeatType === NoteRepeatType.Any) {
                note.repeatValue = convertUTCDateTimeToLocal(note.repeatValue).valueOf();
            }

            if (note.date !== null) {
                if (note.repeatType !== NoteRepeatType.NoRepeat) {
                    dates[note.repeatItemDate].notFinished = dates[note.repeatItemDate].notFinished - 1;
                }

                let field = note.isFinished ? 'finished' : 'notFinished';
                dates[note.date][field] = dates[note.date][field] + 1;
            } else {
                if (note.repeatType === NoteRepeatType.Week) {
                    repeatableWeek[note.repeatValue] = (repeatableWeek[note.repeatValue] || 0) + 1;
                } else if (note.repeatType === NoteRepeatType.Day) {
                    repeatableDay += 1;
                } else if (note.repeatType === NoteRepeatType.Any) {
                    dates[note.repeatValue].notFinished = dates[note.repeatValue].notFinished + 1;
                }
            }
        }

        let currentWeekDay = moment(date).subtract(halfInterval, period).startOf(period).isoWeekday();
        Object.keys(dates).forEach((date) => {
            dates[date].notFinished = dates[date].notFinished + repeatableDay + (repeatableWeek[currentWeekDay] || 0);

            currentWeekDay = (currentWeekDay === 7 ? 1 : currentWeekDay + 1);
        });

        return {
            [period]: {
                intervalStartDate: msIntervalStartDate,
                intervalEndDate: msIntervalEndDate,
                count: dates
            }
        };
    }

    async getFullCount(date, noteFilters) {
        let counts = await Promise.all([this.getCount(date, "week", noteFilters), this.getCount(date, "month", noteFilters)]);
        return {...counts[0], ...counts[1]};
    }
}

let calendarService = new CalendarService();

export default calendarService;