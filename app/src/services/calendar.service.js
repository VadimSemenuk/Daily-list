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

        let dates = {};
        for (let date = moment(msIntervalStartDate); moment(msIntervalEndDate).isSameOrAfter(date); date = moment(date).add(1, 'day').startOf("day")) {
            dates[date.valueOf()] = {
                finished: 0,
                notFinished: 0,
                weekday: date.isoWeekday()
            };
        }
        let datesKeys = Object.keys(dates).map(Number);

        let msIntervalStartDateUTC = convertLocalDateTimeToUTC(msIntervalStartDate).valueOf();
        let msIntervalEndDateUTC = convertLocalDateTimeToUTC(msIntervalEndDate).valueOf();

        let select = await executeSQL(`
            SELECT n.date, n.repeatType, n.repeatItemDate, n.repeatStartDate, n.repeatEndDate, rep.value as repeatValue, n.isFinished, n.tags
            FROM Notes n
            LEFT JOIN NotesRepeatValues rep ON n.id = rep.noteId
            WHERE
                n.lastAction != ? 
                AND (
                    ((n.repeatType = ? OR n.forkFrom IS NOT NULL) AND n.date >= ? AND n.date <= ?)
                    OR (n.forkFrom IS NULL AND n.repeatType IN (?, ?, ?) AND (n.repeatStartDate <= ? OR n.repeatEndDate >= ?))
                )
                AND n.mode = ?;
        `, [NoteAction.Delete, NoteRepeatType.NoRepeat, msIntervalStartDateUTC, msIntervalEndDateUTC, NoteRepeatType.Day, NoteRepeatType.Week, NoteRepeatType.Any, msIntervalEndDateUTC, msIntervalStartDateUTC, NoteMode.WithDateTime]);

        for (let i = 0; i < select.rows.length; i++) {
            try {
                let note = select.rows.item(i);

                if (
                    noteFilters.tags.length
                    && (note.tags ? note.tags.split(",").map(Number) : []).filter((tagId) => noteFilters.tags.filter((_tagId) => _tagId === tagId).length !== 0).length === 0
                ) {
                    continue;
                }

                if (note.date !== null) {
                    if (note.repeatItemDate !== null) {
                        let repeatItemDate = convertUTCDateTimeToLocal(note.repeatItemDate).valueOf();
                        dates[repeatItemDate].notFinished = dates[repeatItemDate].notFinished - 1;
                    }

                    let date = convertUTCDateTimeToLocal(note.date).valueOf();
                    let field = note.isFinished ? 'finished' : 'notFinished';
                    dates[date][field] = dates[date][field] + 1;
                } else {
                    if (note.repeatType === NoteRepeatType.NoRepeat) {
                        let repeatValue = convertUTCDateTimeToLocal(note.repeatValue).valueOf();
                        dates[repeatValue].notFinished += 1;
                    } else {
                        let repeatStartDate = convertUTCDateTimeToLocal(note.repeatStartDate).valueOf();
                        let repeatEndDate = note.repeatEndDate !== null ? convertUTCDateTimeToLocal(note.repeatEndDate).valueOf() : null;

                        for (let date of datesKeys) {
                            if (date >= repeatStartDate && (repeatEndDate === null || date <= repeatEndDate)) {
                                if (note.repeatType === NoteRepeatType.Week) {
                                    if (note.repeatValue === dates[date].weekday) {
                                        dates[date].notFinished += 1;
                                    }
                                } else if (note.repeatType === NoteRepeatType.Day) {
                                    dates[date].notFinished += 1;
                                }
                            }
                        }
                    }
                }
            } catch(err) {
                console.error(err);
            }
        }

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