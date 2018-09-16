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
            WHERE added >= ? AND added <= ? AND userId = ? AND lastAction != 'DELETE'
            GROUP BY added;`, 
            [intervalStartDate, intervalEndDate, authService.getUserId()]
        );  

        let count = {};
        for (let i = 0; i < select.rows.length; i++) {
            let countItem = select.rows.item(i);
            count[countItem.added] = countItem.count
        }

        return {
            [period]: {
                intervalStartDate,
                intervalEndDate,
                count
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