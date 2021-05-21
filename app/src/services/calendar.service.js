import executeSQL from '../utils/executeSQL';
import moment from 'moment';
import getUTCOffset from "../utils/getUTCOffset";
import {NoteAction, NoteMode, NoteRepeatType} from "../constants";

window.moment = moment;

class CalendarService {
    checkForCountUpdate(nextDate, intervalStartDate, intervalEndDate) {
        return !intervalStartDate || !intervalEndDate || nextDate >= intervalEndDate || nextDate <= intervalStartDate
    }

    async getCount(date, period, halfInterval = 20) {
        let utcOffset = getUTCOffset();

        let intervalStartDate = moment(date).startOf(period).subtract(halfInterval, period).valueOf();
        let intervalEndDate = moment(date).endOf(period).add(halfInterval, period).valueOf();
        let intervalStartDateUTC = intervalStartDate + getUTCOffset();
        let intervalEndDateUTC = intervalEndDate + getUTCOffset();

        let select = await executeSQL(`
            SELECT t.date, t.repeatType, rep.value as repeatValue, t.isFinished
            FROM Notes t
            LEFT JOIN NotesRepeatValues rep ON t.id = rep.noteId
            WHERE
                lastAction != ? 
                AND (
                    (repeatType = ? OR forkFrom IS NOT NULL AND date >= ? AND date <= ?)
                    OR (repeatType = ? AND t.forkFrom IS NULL AND rep.value >= ? AND rep.value <= ?)
                    OR (t.forkFrom IS NULL AND repeatType != ?)
                )
                AND mode = ?;
        `, [NoteAction.Delete, NoteRepeatType.NoRepeat, intervalStartDateUTC, intervalEndDateUTC, NoteRepeatType.Any, intervalStartDateUTC, intervalEndDateUTC, NoteRepeatType.Any, NoteMode.WithDateTime]);

        let repeatableDay = 0;
        let repeatableWeek = {};
        let dates = {};
        let dateInitial = {
            finished: 0,
            notFinished: 0
        };

        for (let i = 0; i < select.rows.length; i++) {
            let note = select.rows.item(i);

            if (note.date) {
                note.date = note.date - utcOffset;
            }
            if (note.repeatType === NoteRepeatType.Any) {
                note.repeatValue = note.repeatValue - utcOffset;
            }

            if (note.date && !dates[note.date]) {
                dates[note.date] = {...dateInitial};
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
                    if (!dates[note.repeatValue]) {
                        dates[note.repeatValue] = {...dateInitial};
                    }
                    dates[note.repeatValue].notFinished = dates[note.repeatValue].notFinished + 1;
                }
            }
        }

        let currentWeekDay = moment(date).startOf(period).subtract(halfInterval, period).isoWeekday();
        for (let date = intervalStartDate; date < intervalEndDate; date += 86400000) {
            if (!dates[date]) {
                dates[date] = {...dateInitial};
            }

            dates[date].notFinished = dates[date].notFinished + repeatableDay + (repeatableWeek[currentWeekDay] || 0);

            currentWeekDay = (currentWeekDay === 7 ? 1 : currentWeekDay + 1);
        }

        return {
            [period]: {
                intervalStartDate,
                intervalEndDate,
                count: dates
            }
        };
    }

    async getFullCount(date) {
        let counts = await Promise.all([this.getCount(date, "week"), this.getCount(date, "month")]);

        return {...counts[0], ...counts[1]};
    }
}

let calendarService = new CalendarService();

export default calendarService;