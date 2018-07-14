module.exports = class {
    constructor(db) {
        this.db = db;
    }
    
    async getUserByEmail(email) {
        const res = await this.db.query(`
            SELECT id, email, name, password
            FROM users
            WHERE email = $email
        `, {
            email
        }).catch((err) => console.log(err));

        return res.rows[0];
    }

    async getUserById(id) {
        const res = await this.db.query(`
            SELECT id, email, name
            FROM users
            WHERE id = $id
        `, {
            id
        });

        return res.rows;
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