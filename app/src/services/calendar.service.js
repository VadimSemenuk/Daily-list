import executeSQL from '../utils/executeSQL';
import moment from 'moment';
import getUTCOffset from "../utils/getUTCOffset";
import {NoteAction, NoteRepeatType} from "../constants";

window.moment = moment;

class CalendarService {
    checkForCountUpdate(nextDate, intervalStartDate, intervalEndDate) {
        return !intervalStartDate || !intervalEndDate || nextDate >= intervalEndDate || nextDate <= intervalStartDate
    }

    async getCount(date, period, includeFinished, halfInterval = 20) {
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
                AND mode = 1;
        `, [NoteAction.Delete, NoteRepeatType.NoRepeat, intervalStartDateUTC, intervalEndDateUTC, NoteRepeatType.Any, intervalStartDateUTC, intervalEndDateUTC, NoteRepeatType.Any]);

        let repeatableDay = 0;
        let repeatableWeek = {};
        let dates = {};

        for (let i = 0; i < select.rows.length; i++) {
            let note = select.rows.item(i);

            if (~note.date) {
                note.date = note.date - getUTCOffset();
            }
            if (note.repeatType === NoteRepeatType.Any) {
                note.repeatValue = note.repeatValue - getUTCOffset();
            }

            if (!includeFinished && note.isFinished) {
                if (note.repeatType !== NoteRepeatType.NoRepeat) {
                    dates[note.date] = (dates[note.date] || 0) - 1;
                }
                continue;
            }

            if (note.date !== null) {
                if (note.repeatType === NoteRepeatType.NoRepeat) {
                    dates[note.date] = (dates[note.date] || 0) + 1;
                }
            } else {
                if (note.repeatType === NoteRepeatType.Week) {
                    repeatableWeek[note.repeatValue] = (repeatableWeek[note.repeatValue] || 0) + 1;
                } else if (note.repeatType === NoteRepeatType.Day) {
                    repeatableDay += 1;
                } else if (note.repeatType === NoteRepeatType.Any) {
                    dates[note.repeatValue] = (dates[note.repeatValue] || 0) + 1;
                }
            }
        }

        let currentWeekDay = moment(date).startOf(period).subtract(halfInterval, period).isoWeekday();
        for (let date = intervalStartDate; date < intervalEndDate; date += 86400000) {
            dates[date] = (dates[date] || 0) + repeatableDay + (repeatableWeek[currentWeekDay] || 0);
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

    async getFullCount(date, includeFinished) {
        let counts = await Promise.all([this.getCount(date, "week", includeFinished), this.getCount(date, "month", includeFinished)]);

        return {...counts[0], ...counts[1]};
    }
}

let calendarService = new CalendarService();

export default calendarService;