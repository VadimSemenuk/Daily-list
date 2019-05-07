let format = require('pg-format');

module.exports = class {
    constructor(db) {
        this.db = db;
    }

    logLoad(log) {
        if (Array.isArray(log)) {
            let values = log.map((a) => [a.deviceId, new Date(a.date)]);

            let sql = format(`INSERT INTO LoadLogs (deviceId, date) VALUES %L`, values);
            return this.db.query(sql);
        } else {
            return this.db.query(
                `INSERT INTO LoadLogs (deviceId, date) VALUES ($deviceId, $date);`,
                {
                    deviceId: log.deviceId,
                    date: new Date()
                }
            );
        }
    }

    logError(log) {
        if (Array.isArray(log)) {
            let values = log.map((a) => [a.deviceId, new Date(a.date), JSON.stringify(a.message)]);

            let sql = format(`INSERT INTO ErrorLogs (deviceId, date, log) VALUES %L`, values);
            return this.db.query(sql);
        } else {
            return this.db.query(
                `INSERT INTO ErrorLogs (deviceId, date, log) VALUES ($deviceId, $date, $log);`,
                {
                    deviceId: log.deviceId,
                    date: new Date(),
                    log: JSON.stringify(log.message)
                }
                );
        }
    }
};