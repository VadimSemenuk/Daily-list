import executeSQL from '../utils/executeSQL';
import authService from "./auth.service";
import moment from 'moment';

class CalendarService {
    async updateNotesCount(force, nextDate, intervalStartDate, intervalEndDate, period) {
        if (nextDate >= intervalEndDate || nextDate <= intervalStartDate || force) {
            return this.getNotesCount(nextDate, period);
        };

        return false;
    }

    async getNotesCount(date, period, halfInterval = 25) {
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
}

let calendarService = new CalendarService();

export default calendarService;