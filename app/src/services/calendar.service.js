import executeSQL from '../utils/executeSQL';
import authService from "./auth.service";
import moment from 'moment';

class CalendarService {
    constructor(period) {
        this.period = period;
    }

    interval = 10;
    halfInterval = this.interval / 2;
    intervalStartDate = null;
    intervalEndDate = null;

    async getNotesCount(date) {
        let intervalStartDate = moment(date).startOf(this.period).subtract(this.halfInterval, this.period).valueOf();
        let intervalEndDate = moment(date).startOf(this.period).add(this.halfInterval, this.period).valueOf();

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

        this.intervalStartDate = intervalStartDate;
        this.intervalEndDate = intervalEndDate;

        return count;
    }

    async updateNotesCountData(nextDate) {
        if (nextDate >= this.intervalEndDate || nextDate <= this.intervalStartDate) {
            return this.getNotesCount(nextDate);
        };

        return false;
    }

    setNotesCountInterval(interval) {
        this.interval = interval;
        this.halfInterval = interval / 2;
    }
}

let weekCalendarService = new CalendarService("week");
let monthCalendarService = new CalendarService("month");

export {
    weekCalendarService,
    monthCalendarService
}