let moment = require("moment");

module.exports = class {
    constructor(db) {
        this.db = db;
    }

    async logsReport(period) {
        let where = '';
        let date = null;

        switch(period) {
            case "today": {
                where = "date::date = $date::date";
                date = moment().toDate();
                break;
            }
            case "yesterday": {
                where = 'date::date = $date::date';
                date = moment().subtract(1, "day").toDate();
                break;
            }
            case "week": {
                where = 'date::date >= $date::date';
                date = moment().subtract(1, "week").toDate();
                break;
            }
            case "month": {
                where = 'date::date >= $date::date';
                date = moment().subtract(1, "month").toDate();
                break;
            }
            case "year": {
                where = 'date::date >= $date::date';
                date = moment().subtract(1, "year").toDate();
                break;
            }
            case "all": {
                where = 'date IS NOT NULL';
                break;
            }
            default: {
                where = "date::date = $date::date";
                date = new Date();
                break;
            }
        }

        let select = await this.db.query(`
            select count(uniqueDevices.deviceid) as total_loads, avg(uniqueDevices.number_of_loads) as avarage_load_count
            from (
                SELECT deviceid, max(date) as last_load, count(date) as number_of_loads 
                FROM public.load_logs
                where ${where}
                group by deviceid
            ) as uniqueDevices
        `, {
            date
        })
            .catch((err) => {
                console.log(err);
                return false;
            });

        return select.rows[0];
    }
};