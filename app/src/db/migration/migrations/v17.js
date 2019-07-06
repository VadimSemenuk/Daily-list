import uuid from "uuid/v1";
import moment from "moment";

import execureSQL from "../../../utils/executeSQL";
import config from "../../../config/config";

export default {
    name: "1.7",

    async run() {
        await addUUID();
        await addMetaTable();
        await alterTasksTable();
        // await forkFromFieldToUUID();
        await alterSettingsTable();
        await addErrorsLogsTable();
        await addLoadsLogsTable();

        let token = JSON.parse(localStorage.getItem(config.LSTokenKey)) || {};
        if (!token || !token.id) {
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
                    isRateDialogShowed INTEGER,
                    backupMigrated INTEGER,
                    appInstalledDate INTEGER
                );
            `);

            await execureSQL(`
                INSERT INTO MetaInfo (deviceId, isRateDialogShowed, backupMigrated, appInstalledDate)
                SELECT 
                    deviceId, 
                    0 as isRateDialogShowed,
                    0 as backupMigrated,
                    ? as appInstalledDate
                FROM MetaInfo_OLD
            `, [moment().startOf("day").valueOf()]);

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
                    manualOrderIndex INTEGER,
                    mode INTEGER,
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
                    repeatDate,
                    mode
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
                    CASE forkFrom WHEN -1 THEN -1 ELSE added END as repeatDate,
                    1 as mode
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
            let currentSortSettings = (selectItems && selectItems.sort) ? JSON.parse(selectItems.sort) : false;
            if (!currentSortSettings) {
                currentSortSettings = {
                    type: 2,
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
                    minimizeNotes INTEGER,
                    calendarMode INTEGER,
                    notesScreenMode INTEGER
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
                    minimizeNotes,
                    calendarMode,
                    notesScreenMode
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
                    1 as minimizeNotes,
                    1 as calendarMode,
                    1 as notesScreenMode
                FROM Settings_OLD;
            `, [currentSortSettings.type, currentSortSettings.direction, currentSortSettings.finSort, 0]);
            await execureSQL(`DROP TABLE Settings_OLD;`);
        }

        async function addErrorsLogsTable () {
            await execureSQL(`
                CREATE TABLE IF NOT EXISTS ErrorLogs
                (
                    date INTEGER,
                    message TEXT,
                    deviceId TEXT
                );
            `);
        }

        async function addLoadsLogsTable () {
            await execureSQL(`
                CREATE TABLE IF NOT EXISTS LoadLogs
                (
                    date INTEGER,
                    deviceId TEXT
                );
            `);
        }
    }
}