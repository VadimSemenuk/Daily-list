import executeSQL from '../utils/executeSQL';
import moment from 'moment';

window.moment = moment;

class CalendarService {
    checkForCountUpdate(nextDate, intervalStartDate, intervalEndDate) {
        return !intervalStartDate || !intervalEndDate || nextDate >= intervalEndDate || nextDate <= intervalStartDate
    }

    async getCount(date, period, includeFinished, halfInterval = 20) {
        let start = performance.now();

        let intervalStartDate = moment(date).startOf(period).subtract(halfInterval, period).valueOf();
        let intervalEndDate = moment(date).endOf(period).add(halfInterval, period).valueOf();

        let select = await executeSQL(`
            select t.added, t.repeatType, rep.value as repeatValue, t.finished, t.repeatDate
            from Tasks t
            LEFT JOIN TasksRepeatValues rep ON t.id = rep.taskId
            where 
                lastAction != 'DELETE' 
                AND lastAction != 'CLEAR' 
                AND (
                    (repeatType = 'no-repeat' OR forkFrom != -1 AND added >= ? AND added <= ?)
                    OR (repeatType = 'any' AND t.forkFrom = -1 AND rep.value >= ? AND rep.value <= ?)
                    OR (t.forkFrom = -1 AND repeatType != 'any')
                )
        `, [intervalStartDate, intervalEndDate, intervalStartDate, intervalEndDate]);

        let repeatableDay = 0;
        let repeatableWeek = {};
        let dates = {};

        for (let i = 0; i < select.rows.length; i++) {
            let note = select.rows.item(i);

            if (!includeFinished && note.finished) {
                if (note.repeatType !== "no-repeat") {
                    dates[note.added] = (dates[note.added] || 0) -1;
                }
                continue;
            }

            if (note.added !== -1) {
                if (note.repeatDate !== -1 && note.repeatDate === note.added) {
                    continue;
                }

                dates[note.added] = (dates[note.added] || 0) + 1;
                if (note.repeatDate !== -1 && note.repeatDate !== note.added) {
                    dates[note.repeatDate] = (dates[note.repeatDate] || 0) - 1;
                }
            } else {
                if (note.repeatType === "week") {
                    repeatableWeek[note.repeatValue] = (repeatableWeek[note.repeatValue] || 0) + 1;
                } else if (note.repeatType === "day") {
                    repeatableDay += 1;
                } else if (note.repeatType === "any") {
                    dates[note.repeatValue] = (dates[note.repeatValue] + 0) + 1;
                }
            }
        }

        let currentWeekDay = moment(date).startOf(period).subtract(halfInterval, period).isoWeekday();
        for (let date = intervalStartDate; date < intervalEndDate; date += 86400000) {
            currentWeekDay = (currentWeekDay > 7 ? 1 : currentWeekDay + 1);
            dates[date] = (dates[date] || 0) + repeatableDay + (repeatableWeek[currentWeekDay] || 0);
        }

        let end = performance.now();
        console.log(end - start);

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