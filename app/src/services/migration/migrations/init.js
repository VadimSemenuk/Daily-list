import execureSQL from "../../../utils/executeSQL";

export default {
    name: "init",

    async run() {
        await createTables();
        await fillDb();
    }
}

async function createTables () {
    await execureSQL(
        `CREATE TABLE IF NOT EXISTS Tasks
        (
            id INTEGER PRIMARY KEY,
            uuid TEXT,
            title TEXT,
            startTime INTEGER,
            endTime INTEGER,
            notificate INTEGER,
            tag TEXT,
            dynamicFields TEXT,
            added INTEGER,
            finished INTEGER DEFAULT 0,
            isSynced INTEGER DEFAULT 0,
            isLastActionSynced INTEGER DEFAULT 0,
            lastAction TEXT,
            lastActionTime INTEGER,
            userId INTEGER,
            UNIQUE (uuid) ON CONFLICT REPLACE                    
        );`
    )
    
    await execureSQL(
        `CREATE TABLE IF NOT EXISTS Settings
        (
            defaultNotification INTEGER DEFAULT 1,
            sort INTEGER DEFAULT 4,
            fastAdd INTEGER DEFAULT 1,
            colorTheme INTEGER DEFAULT 0,
            password TEXT,    
            fontSize INTEGER DEFAULT 14,
            finishedSort INTEGER DEFAULT 1,
            autoBackup INTEGER DEFAULT 0
        );`
    )
}

async function fillDb () {
    await execureSQL(
        `INSERT INTO Settings
        (defaultNotification, sort, fastAdd, colorTheme, fontSize, finishedSort, autoBackup)
        VALUES (1, 3, 0, 0, 14, 1, 0);`
    )
}