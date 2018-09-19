import executeSQL from '../utils/executeSQL';
import authService from "./auth.service";
import moment from 'moment';

class CalendarService {
    checkForCountUpdate(nextDate, intervalStartDate, intervalEndDate) {
        return !intervalStartDate || !intervalEndDate || nextDate >= intervalEndDate || nextDate <= intervalStartDate
    }

    async getCount(date, period, halfInterval = 25) {
        let intervalStartDate = moment(date).startOf(period).subtract(halfInterval, period).valueOf();
        let intervalEndDate = moment(date).startOf(period).add(halfInterval, period).valueOf();

        let select = await executeSQL(
            `SELECT COUNT(*) as count, added FROM Tasks
            WHERE 
                added >= ? AND added <= ? AND 
                userId = ? AND 
                lastAction != 'DELETE' AND
                repeatType = 'no-repeat'
            GROUP BY added;`, 
            [intervalStartDate, intervalEndDate, authService.getUserId()]
        );  

        let selectRepeatableDay = await executeSQL(
            `SELECT COUNT(*) as count, added FROM Tasks
            WHERE 
                userId = ? AND 
                lastAction != 'DELETE' AND
                repeatType = "day";`, 
            [authService.getUserId()]
        ); 

        let selectRepeatableWeek = await executeSQL(
            `SELECT COUNT(*) as count, rep.value as weekDay FROM Tasks t
			LEFT JOIN TasksRepeatValues rep ON t.id = rep.taskId
            WHERE
                userId = ? AND
                lastAction != 'DELETE' AND
                repeatType = "week"
			GROUP BY rep.value;`, 
            [authService.getUserId()]
        );    

        let selectRepeatableAny = await executeSQL(
            `SELECT COUNT(*) as count, rep.value as added FROM Tasks t
			LEFT JOIN TasksRepeatValues rep ON t.id = rep.taskId
            WHERE
                userId = ? AND
                lastAction != 'DELETE' AND
				t.repeatType = 'any'
			GROUP BY rep.value;`, 
            [authService.getUserId()]
        );  

        let count = {};
        for (let i = 0; i < select.rows.length; i++) {
            let countItem = select.rows.item(i);
            count[countItem.added] = countItem.count
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
        for (let i = 0; i < selectRepeatableAny.rows.length; i++) {
            let countItem = selectRepeatableAny.rows.item(i);
            repeatable.any[countItem.added] = countItem.count
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

    async getFullCount(date) {
        let counts = await Promise.all([this.getCount(date, "week"), this.getCount(date, "month")]);

        return {...counts[0], ...counts[1]}
    }
}

let calendarService = new CalendarService();

export default calendarService;