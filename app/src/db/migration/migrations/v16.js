import execureSQL from "../../../utils/executeSQL";
import config from "../../../config/config";

export default {
    name: "1.6",

    async run() {
        await addMigrationsTable();
        await alterSettingsTable();
        await alterTasksTable();

        async function addMigrationsTable () {
            await execureSQL(
                `CREATE TABLE IF NOT EXISTS Migrations
                (
                    id INTEGER PRIMARY KEY,
                    name TEXT                  
                );`
            );
        }

        async function alterSettingsTable () {
            await execureSQL(`ALTER TABLE Settings RENAME TO Settings_OLD;`);
            await execureSQL(`                           
                CREATE TABLE IF NOT EXISTS Settings
                (
                    defaultNotification INTEGER,
                    sort TEXT,
                    fastAdd INTEGER,
                    theme INTEGER,
                    password TEXT,    
                    fontSize INTEGER,
                    showMiniCalendar INTEGER,
                    notesShowInterval INTEGER,
                    lang TEXT,
                    calendarNotesCounter INTEGER
                );
            `);
            await execureSQL(`
                INSERT INTO Settings (defaultNotification, fastAdd, theme, password, fontSize) 
                SELECT defaultNotification, fastAdd, colorTheme AS theme, password, fontSize 
                FROM Settings_OLD;
            `);
            await execureSQL(`DROP TABLE Settings_OLD;`);
            let sort = {
                type: 1,
                direction: 1,
                finSort: 1
            }
            let lang = navigator.globalization ? (await new Promise((resolve, reject) => navigator.globalization.getPreferredLanguage(resolve, reject))) : config.defaultLang;
            if (lang) {
                lang = lang.value || config.defaultLang;
            }
            if (lang.indexOf("-") !== -1) {
                lang = lang.split("-")[0];
            }
            await execureSQL(`
                UPDATE Settings 
                SET 
                    sort = ?, 
                    showMiniCalendar = ?,
                    notesShowInterval = ?,
                    lang = ?,
                    calendarNotesCounter = ?;`, 
                [JSON.stringify(sort), 1, 1, lang, 1]
            );
        }

        async function alterTasksTable () {
            let msNow = +new Date(); 
            await execureSQL(`ALTER TABLE Tasks RENAME TO Tasks_OLD;`);
            await execureSQL(`                           
                CREATE TABLE IF NOT EXISTS Tasks
                (
                    id INTEGER PRIMARY KEY,
                    uuid TEXT,
                    title TEXT,
                    added INTEGER,
                    finished INTEGER,
                    dynamicFields TEXT,
                    startTime INTEGER,
                    endTime INTEGER,
                    startTimeCheckSum, 
                    endTimeCheckSum,
                    notificate INTEGER,
                    tag TEXT,
                    isSynced INTEGER,
                    isLastActionSynced INTEGER,
                    lastAction TEXT,
                    lastActionTime INTEGER,
                    userId INTEGER,
                    repeatType INTEGER,
                    forkFrom INTEGER,
                    UNIQUE (uuid) ON CONFLICT REPLACE 
                );
            `);

            await execureSQL(
                `CREATE TABLE IF NOT EXISTS TasksRepeatValues
                (
                    taskId INTEGER,
                    value INTEGER,
                    FOREIGN KEY(taskId) REFERENCES Tasks(id)
                );`
            );

            await execureSQL(`
                INSERT INTO Tasks (
                    id, 
                    title, 
                    added,
                    finished,
                    dynamicFields,
                    startTime, 
                    endTime, 
                    startTimeCheckSum, 
                    endTimeCheckSum,
                    notificate, 
                    tag, 
                    isSynced,
                    isLastActionSynced,
                    lastAction,
                    lastActionTime,
                    userId,
                    repeatType,
                    forkFrom
                ) 
                SELECT
                    id,  
                    title, 
                    added,
                    finished,
                    dynamicFields,
                    startTime, 
                    endTime, 
                    startTime - added as startTimeCheckSum,
                    endTime - added as endTimeCheckSum,
                    notificate, 
                    tag, 
                    0 as isSynced,
                    0 as isLastActionSynced,
                    'ADD' as lastAction,
                    ? as lastActionTime,
                    1 as userId,
                    'no-repeat' as repeatType,
                    -1
                FROM Tasks_OLD;
            `, [msNow]);

            await execureSQL(`DROP TABLE Tasks_OLD;`);
        }
    }
}