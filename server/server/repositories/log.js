var format = require('pg-format');

module.exports = class {
    constructor(db) {
        this.db = db;
    }

    async logLoad(deviceId) {
        let insert = await this.db.query(`
            INSERT INTO LoadLogs (deviceId, date) VALUES ($deviceId, $date);
        `, {
            deviceId,
            date: new Date()
        })
        .catch((err) => {
            console.log(err);
            return false;
        })

        return insert;
    }

    async logError(log) {
        if (Array.isArray(log)) {
            let values = log.map((a) => {
                return [a.message.additionalInto.deviceId, new Date(a.date), JSON.stringify(a.message)]
            });

            let sql = format(`INSERT INTO ErrorLogs (deviceId, date, log) VALUES %L`, values);
            let insert = await this.db.query(sql)
                .catch((err) => {
                    console.log(err);
                    return false;
                });
            return insert;
        } else {
            let insert = await this.db.query(`
                INSERT INTO ErrorLogs (deviceId, date, log) VALUES ($deviceId, $date, $log);
            `, {
                    deviceId: log.additionalInto.deviceId,
                    date: new Date(),
                    log: JSON.stringify(log)
                })
                    .catch((err) => {
                        console.log(err);
                        return false;
                    });
            return insert;
        }
    }
};