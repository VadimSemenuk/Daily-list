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

        CREATE TABLE IF NOT EXISTS Tasks
        (
            id SERIAL PRIMARY KEY,
            uuid VARCHAR UNIQUE,
            title VARCHAR,
            startTime BIGINT,
            endTime BIGINT,
            notificate BOOLEAN,
            tag VARCHAR,
            dynamicFields VARCHAR,
            added BIGINT,
            finished BOOLEAN DEFAULT false,
            userId INTEGER references Users(id),
            lastAction VARCHAR,
            lastActionTime BIGINT
        );

        CREATE TABLE IF NOT EXISTS Tasks_Devices
        (
            taskUUID VARCHAR references Tasks(uuid),
            deviceId VARCHAR,
            userId INTEGER references Users(id)
        );
    `);
};

module.exports.down = async (db) => {

};