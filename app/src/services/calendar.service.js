import executeSQL from '../utils/executeSQL';
import moment from 'moment';

class CalendarService {
    checkForCountUpdate(nextDate, intervalStartDate, intervalEndDate) {
        return !intervalStartDate || !intervalEndDate || nextDate >= intervalEndDate || nextDate <= intervalStartDate
    }

    async getCount(date, period, includeFinished, halfInterval = 5) {
        let intervalStartDate = moment(date).startOf(period).subtract(halfInterval, period).valueOf();
        let intervalEndDate = moment(date).startOf(period).add(halfInterval, period).valueOf();

        let selectTask = executeSQL(
            `SELECT COUNT(*) as count, added FROM (
                SELECT added FROM Tasks
                    WHERE
                        added >= ? AND added <= ? AND
                        lastAction != 'DELETE' AND
                        repeatType = 'no-repeat'
                UNION ALL
                SELECT rep.value as added FROM Tasks t
                    LEFT JOIN TasksRepeatValues rep ON t.id = rep.taskId
                    WHERE
                        rep.value >= ? AND rep.value <= ? AND
                        lastAction != 'DELETE' AND
                        t.repeatType = 'any' AND
                        t.forkFrom = -1
                )
            GROUP BY added;`, 
            [intervalStartDate, intervalEndDate, intervalStartDate, intervalEndDate]
        );   

        let selectRepeatableDayTask = executeSQL(
            `SELECT COUNT(*) as count, added FROM Tasks
            WHERE 
                lastAction != 'DELETE' AND
                repeatType = "day" AND
                forkFrom = -1;
        `); 

        let selectRepeatableWeekTask = executeSQL(
            `SELECT COUNT(*) as count, rep.value as weekDay FROM Tasks t
			LEFT JOIN TasksRepeatValues rep ON t.id = rep.taskId
            WHERE
                lastAction != 'DELETE' AND
                repeatType = "week" AND
                t.forkFrom = -1
			GROUP BY rep.value;
        `);

        let tasks = [selectTask, selectRepeatableDayTask, selectRepeatableWeekTask];
        if (!includeFinished) {
            tasks.push(executeSQL(
                `SELECT COUNT(*) as count, added FROM (
                SELECT added FROM Tasks
                    WHERE
                        added >= ? AND added <= ? AND
                        lastAction != 'DELETE' AND
                        (repeatType = 'no-repeat' OR forkFrom != -1) AND finished = 1
            )
            GROUP BY added;`,
                [intervalStartDate, intervalEndDate]
            ));
        }
        let selects = await Promise.all(tasks);

        let select = selects[0];
        let selectRepeatableDay = selects[1];
        let selectRepeatableWeek = selects[2];
        let selectFinished = selects[3];

        let count = {};
        for (let i = 0; i < select.rows.length; i++) {
            let countItem = select.rows.item(i);
            count[countItem.added] = countItem.count;
        }

        if (!includeFinished) {
            for (let i = 0; i < selectFinished.rows.length; i++) {
                let countItem = selectFinished.rows.item(i);
                count[countItem.added] -= countItem.count;
            }
        }
 
        let repeatable = {
            day: 0,
            week: {},
            any: {}
        };
        repeatable.day = selectRepeatableDay.rows.item(0).count;
        for (let i = 0; i < selectRepeatableWeek.rows.length; i++) {
            let countItem = selectRepeatableWeek.rows.item(i);
            repeatable.week[countItem.weekDay] = countItem.count
        }

        return {
            [period]: {
                intervalStartDate,
                intervalEndDate,
                count,
                repeatable
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