module.exports = class {
    constructor(db) {
        this.db = db;
    }

    async logLoad(deviceId) {
        let insert = await this.db.query(`
            INSERT INTO load_logs (deviceId, date) VALUES ($deviceId, $date);
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
};