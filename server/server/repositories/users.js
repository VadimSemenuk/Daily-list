module.exports = class {
    constructor(db) {
        this.db = db;
    }
    
    async getUserByField(fieldName, fieldValue) {
        const res = await this.db.query(`
            SELECT id, email, name, password
            FROM users
            WHERE ${fieldName} = $value;
        `, {
            value: fieldValue
        }).catch((err) => console.log(err));

        return res.rows[0];
    }

    async createUser(user) {
        const insert = await this.db.query(`
            INSERT INTO users
            (name, password, email)
            VALUES($name, $password, $email)
            RETURNING id;
        `, user).catch((err) => console.log(err));

        return insert.rows[0].id;
    }
};