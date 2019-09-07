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

        CREATE TABLE LoadLogs 
        (
            id SERIAL PRIMARY KEY,
            deviceId VARCHAR,
            date timestamp with time zone
        );

        CREATE TABLE ErrorLogs 
        (
            id SERIAL PRIMARY KEY,
            deviceId VARCHAR,
            date timestamp with time zone,
            log JSON
        );
    `)
};

module.exports.down = async (db) => {

};