import executeSQL from '../utils/executeSQL';
import moment from 'moment';
import getUTCOffset from "../utils/getUTCOffset";
import {NoteAction, NoteMode, NoteRepeatType} from "../constants";

window.moment = moment;

class CalendarService {
    checkForCountUpdate(nextDate, intervalStartDate, intervalEndDate) {
        return !intervalStartDate || !intervalEndDate || nextDate >= intervalEndDate || nextDate <= intervalStartDate
    }

    async getCount(date, period, noteFilters) {
        let utcOffset = getUTCOffset();
        let halfInterval = 20;

        let intervalStartDate = moment(date).startOf(period).subtract(halfInterval, period).valueOf();
        let intervalEndDate = moment(date).endOf(period).add(halfInterval, period).valueOf();
        let intervalStartDateUTC = intervalStartDate + getUTCOffset();
        let intervalEndDateUTC = intervalEndDate + getUTCOffset();

        let select = await executeSQL(`
            SELECT n.date, n.repeatType, rep.value as repeatValue, n.isFinished, n.tags
            FROM Notes n
            LEFT JOIN NotesRepeatValues rep ON n.id = rep.noteId
            WHERE
                n.lastAction != ? 
                AND (
                    (n.repeatType = ? OR n.forkFrom IS NOT NULL AND n.date >= ? AND n.date <= ?)
                    OR (n.repeatType = ? AND n.forkFrom IS NULL AND rep.value >= ? AND rep.value <= ?)
                    OR (n.forkFrom IS NULL AND n.repeatType != ?)
                )
                AND n.mode = ?;
        `, [NoteAction.Delete, NoteRepeatType.NoRepeat, intervalStartDateUTC, intervalEndDateUTC, NoteRepeatType.Any, intervalStartDateUTC, intervalEndDateUTC, NoteRepeatType.Any, NoteMode.WithDateTime]);

        let dates = {};
        let dateInitial = {
            finished: 0,
            notFinished: 0
        };
        for (let date = intervalStartDate; date < intervalEndDate; date += 86400000) {
            dates[date] = {...dateInitial};
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
                note.date = note.date - utcOffset;
            }
            if (note.repeatType === NoteRepeatType.Any) {
                note.repeatValue = note.repeatValue - utcOffset;
            }

            if (note.isFinished) {
                if (note.repeatType !== NoteRepeatType.NoRepeat) {
                    dates[note.date].notFinished = dates[note.date].notFinished - 1;
                }
                dates[note.date].finished = dates[note.date].finished + 1;
                continue;
            }

            if (note.date !== null) {
                if (note.repeatType === NoteRepeatType.NoRepeat) {
                    dates[note.date].notFinished = dates[note.date].notFinished + 1;
                }
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

        let currentWeekDay = moment(date).startOf(period).subtract(halfInterval, period).isoWeekday();
        Object.keys(dates).forEach((date) => {
            dates[date].notFinished = dates[date].notFinished + repeatableDay + (repeatableWeek[currentWeekDay] || 0);

            currentWeekDay = (currentWeekDay === 7 ? 1 : currentWeekDay + 1);
        });

        return {
            [period]: {
                intervalStartDate,
                intervalEndDate,
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