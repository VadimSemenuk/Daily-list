import executeSQL from "../utils/executeSQL";
import moment from "moment";

class TimezoneService {
    async processTimezone() {
        let select = (await executeSQL(`select savedTimezone, isPreviousTimezoneProcessed from MetaInfo;`)).rows;

        let isPreviousTimezoneProcessed = select.item(0).isPreviousTimezoneProcessed;
        if (!isPreviousTimezoneProcessed) {
            return;
        }

        let savedTimezone = select.item(0).savedTimezone;
        let currentTimezone = moment().utcOffset();

        if (savedTimezone !== currentTimezone) {
            let timezoneDiffMs = (savedTimezone - currentTimezone) * 60 * 1000;

            await executeSQL(`update MetaInfo set savedTimezone = ?;`, [currentTimezone]);
            await executeSQL(`update Tasks set added = added + ? where added != -1;`, [timezoneDiffMs]);
            await executeSQL(`update TasksRepeatValues set value = value + ? where value > 7;`, [timezoneDiffMs]);

            let tasksSelect = await executeSQL(`select id, added from Tasks where added != -1;`);
            let tasks = [];
            for (let i = 0; i < tasksSelect.rows.length; i++) {
                tasks.push(tasksSelect.rows.item(i));
            }
            for (let task of tasks) {
                let date = moment(task.added);
                if ((date.hour() !== 0) || (date.minute() !== 0)) {
                    if (date.hour() > 12) {
                        date.add(1, 'day');
                    }
                    date.hour(0);
                    date.minute(0);
                    date.second(0);
                    date.millisecond(0);
                }

                await executeSQL(`update Tasks set added = ? where id = ?;`, [date.valueOf(), task.id]);
            }
        }
    }

    async processDefaultTimezone(timezone) {
        await executeSQL(`update MetaInfo set isPreviousTimezoneProcessed = ?;`, [1]);
        await executeSQL(`update MetaInfo set savedTimezone = ?;`, [timezone]);
        this.processTimezone();
    }
}

let timezoneService = new TimezoneService();

export default timezoneService;