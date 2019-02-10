import uuid from "uuid/v1";

import execureSQL from "../../../utils/executeSQL";
import config from "../../../config/config";

export default {
    name: "1.7",

    async run() {
        await addUUID();
        await addMetaTable();
        await alterTasksTable();
        await forkFromFieldToUUID();
        await alterSettingsTable();
        await addErrorsTable();

        let token = JSON.parse(localStorage.getItem(config.LSTokenKey)) || {};
        if (!token.id) {
            return
        }
        token.backup = {lastBackupTime: null};
        token.settings = {autoBackup: false};
        localStorage.setItem(config.LSTokenKey, JSON.stringify(token));

        async function addUUID() {
            let select = await execureSQL(`SELECT id from Tasks WHERE uuid is null`);
            let updateValues = [];
            let updateValuesStr = "";
            if (!select.rows || !select.rows.length) {
                return
            }

            for (let i = 0; i < select.rows.length; i++) {
                let item = select.rows.item(i);
                updateValues.push(item.id);
                updateValues.push(uuid());
                updateValuesStr += ", (?, ?)";
            }
            updateValuesStr = updateValuesStr.slice(2);

            return execureSQL(`
                WITH Tmp(id, uuid) AS (VALUES ${updateValuesStr})
	
                UPDATE Tasks SET uuid = (SELECT uuid FROM Tmp WHERE Tasks.id = Tmp.id) WHERE id IN (SELECT id FROM Tmp);
            `, updateValues);
        }

        async function addMetaTable () {
            await execureSQL(`ALTER TABLE MetaInfo RENAME TO MetaInfo_OLD;`);

            await execureSQL(`
                CREATE TABLE IF NOT EXISTS MetaInfo
                (   
                    deviceId TEXT,
                    IsRateDialogShowed INTEGER,
                    nextVersionMigrated INTEGER
                );
            `);

            await execureSQL(`
                INSERT INTO MetaInfo (deviceId, IsRateDialogShowed, nextVersionMigrated)
                SELECT 
                    deviceId, 
                    0 as IsRateDialogShowed,
                    0 as nextVersionMigrated
                FROM MetaInfo_OLD
            `);

            await execureSQL(`DROP TABLE MetaInfo_OLD;`);
        }

        async function alterTasksTable () {
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
                    priority INTEGER,
                    repeatDate INTEGER,
                    UNIQUE (uuid) ON CONFLICT REPLACE
                );
            `);

            await execureSQL(`
                INSERT INTO Tasks (
                    id,
                    uuid, 
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
                    forkFrom,
                    priority,
                    repeatDate
                ) 
                SELECT
                    id, 
                    uuid,
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
                    0,
                    0,
                    lastAction,
                    lastActionTime,
                    userId,
                    repeatType,
                    forkFrom,
                    2 as priority,
                    CASE forkFrom WHEN -1 THEN -1 ELSE added END as repeatDate
                FROM Tasks_OLD;
            `);

            await execureSQL(`DROP TABLE Tasks_OLD;`);
        }

        async function forkFromFieldToUUID() {
            await execureSQL(`
                update Tasks
                set forkFrom =
                    (
                        select (select uuid from Tasks ttt where tt.forkFrom = ttt.id ) original
                        from Tasks tt
                        where Tasks.id = tt.id
                    )
                where forkFrom != -1
            `);
        }

        async function alterSettingsTable () {
            let select = await execureSQL(`SELECT sort FROM Settings;`);
            let selectItems = select.rows.item(0);
            let currentSortSettings = (selectItems && selectItems.sort ) ? JSON.parse(selectItems.sort) : false;
            if (!currentSortSettings) {
                currentSortSettings = {
                    type: 1,
                    direction: 1,
                    finSort: 1
                }
            }

            await execureSQL(`ALTER TABLE Settings RENAME TO Settings_OLD;`);
            await execureSQL(`                           
                CREATE TABLE IF NOT EXISTS Settings
                (
                    defaultNotification INTEGER,
                    fastAdd INTEGER,
                    theme INTEGER,
                    password TEXT,    
                    fontSize INTEGER,
                    notesShowInterval INTEGER,
                    lang TEXT,
                    calendarNotesCounter INTEGER,
                    calendarNotesCounterIncludeFinished INTEGER,
                    sortType INTEGER,
                    sortDirection INTEGER,
                    sortFinBehaviour INTEGER,
                    sortIncludePriority INTEGER,
                    minimizeNotes INTEGER
                );
            `);
            await execureSQL(`
                INSERT INTO Settings (
                    defaultNotification,
                    fastAdd,
                    theme,
                    password,    
                    fontSize,
                    notesShowInterval,
                    lang,
                    calendarNotesCounter,
                    calendarNotesCounterIncludeFinished,
                    sortType,
                    sortDirection,
                    sortFinBehaviour,
                    sortIncludePriority,
                    minimizeNotes
                ) 
                SELECT 
                    defaultNotification, 
                    fastAdd,
                    theme, 
                    password, 
                    fontSize, 
                    notesShowInterval, 
                    lang, 
                    calendarNotesCounter,
                    0 as calendarNotesCounterIncludeFinished,
                    ? as sortType,
                    ? as sortDirection,
                    ? as sortFinBehaviour,
                    ? as sortIncludePriority,
                    1 as minimizeNotes
                FROM Settings_OLD;
            `, [currentSortSettings.type || 1, currentSortSettings.direction || 1, currentSortSettings.finSort || 1, 1]);
            await execureSQL(`DROP TABLE Settings_OLD;`);
        }

        async function addErrorsTable () {
            await execureSQL(`
                CREATE TABLE IF NOT EXISTS ErrorLogs
                (
                    date INTEGER,
                    message TEXT
                );
            `);
        }
    }
}