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
        })

        return insert;
    }
};