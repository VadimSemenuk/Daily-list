module.exports.id = 'init';

module.exports.up = async (db) => {
    return db.query(`
        CREATE TABLE _migrations (
            name text primary key,
            date timestamp
        );

        CREATE TABLE IF NOT EXISTS Users
        (
            id SERIAL PRIMARY KEY,
            name VARCHAR,
            password VARCHAR,
            email VARCHAR,
            google_id VARCHAR
        );

        CREATE TABLE NoteBackups
        (
            uuid VARCHAR,
            note JSON,
            userId INTEGER references Users(id)
        )
    `)
};

module.exports.down = async (db) => {

};