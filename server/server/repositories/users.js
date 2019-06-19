module.exports = class {
    constructor(db) {
        this.db = db;
    }
    
    async getUserByField(fieldName, fieldValue) {
        const userSelect = await this.db.query(`
            SELECT id, email, name, password
            FROM users
            WHERE ${fieldName} = $value;
        `, {value: fieldValue});

        let user = userSelect.rows[0];

        let userLastBackupTimeSelect = await this.db.query(`
            SELECT datetime
            FROM NotesBackups
            WHERE userId = $userId
            ORDER BY datetime
            Limit 1
        `, {$userId: user.id});
        user.LastBackupTime = userLastBackupTimeSelect.rows[0] ? userLastBackupTimeSelect.rows[0].datetime : null;

        return user;
    }

    async createUser(user) {
        const insert = await this.db.query(`
            INSERT INTO users
            (name, password, email, google_id)
            VALUES($name, $password, $email, $google_id)
            RETURNING id;
        `, user);

        return insert.rows[0].id;
    }
};