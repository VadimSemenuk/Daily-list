import moment from "moment";
import md5 from "md5";

import execureSQL from "../../../utils/executeSQL";
import config from "../../../config/config";
import getUTCOffset from "../../../utils/getUTCOffset";
import {NoteRepeatType} from "../../../constants";

export default {
    name: "1.7",

    async run() {
        await alterTasksRepeatValuesTable();
        await addMetaTable();
        await alterTasksTable();
        await alterSettingsTable();
        await addErrorsLogsTable();
        await addLoadsLogsTable();
        await updateToken();
        await convertDatesToUTC();
        await addPasswordEncryption();

        async function alterTasksRepeatValuesTable () {
            await execureSQL(`
                CREATE TABLE IF NOT EXISTS NotesRepeatValues
                (   
                    noteId INTEGER,
                    value INTEGER,
                    FOREIGN KEY(noteId) REFERENCES Notes(id)
                );
            `);

            await execureSQL(`
                INSERT INTO NotesRepeatValues (noteId, value) 
                SELECT taskId, value FROM TasksRepeatValues;
            `);

            await execureSQL(`DROP TABLE TasksRepeatValues`);
        }

        async function addMetaTable () {
            await execureSQL(`ALTER TABLE MetaInfo RENAME TO MetaInfo_OLD;`);

            await execureSQL(`
                CREATE TABLE IF NOT EXISTS MetaInfo
                (   
                    deviceId TEXT,
                    isRateDialogShowed INTEGER,
                    appInstalledDate INTEGER
                );
            `);

            await execureSQL(`
                INSERT INTO MetaInfo (deviceId, isRateDialogShowed, appInstalledDate)
                SELECT 
                    deviceId, 
                    0 as isRateDialogShowed,
                    ? as appInstalledDate
                FROM MetaInfo_OLD
            `, [moment().startOf("day").valueOf()]);

            await execureSQL(`DROP TABLE MetaInfo_OLD;`);
        }

        async function alterTasksTable () {
            await execureSQL(`                           
                CREATE TABLE IF NOT EXISTS Notes
                (
                    id INTEGER PRIMARY KEY,
                    title TEXT,
                    date INTEGER,
                    isFinished INTEGER,
                    contentItems TEXT,
                    startTime INTEGER,
                    endTime INTEGER,
                    isNotificationEnabled INTEGER,
                    tag TEXT,
                    lastAction TEXT,
                    lastActionTime INTEGER,
                    repeatType INTEGER,
                    forkFrom INTEGER,
                    manualOrderIndex INTEGER,
                    mode INTEGER,
                    utcOffset INTEGER,
                    UNIQUE (id) ON CONFLICT REPLACE
                );
            `);

            await execureSQL(`
                INSERT INTO Notes (
                    id,
                    title, 
                    date,
                    isFinished,
                    contentItems,
                    startTime, 
                    endTime, 
                    isNotificationEnabled, 
                    tag, 
                    lastAction,
                    lastActionTime,
                    repeatType,
                    forkFrom,
                    mode
                ) 
                SELECT
                    id, 
                    title, 
                    added as date,
                    finished,
                    dynamicFields as contentItems,
                    startTime, 
                    endTime, 
                    notificate as isNotificationEnabled, 
                    tag, 
                    lastAction,
                    lastActionTime,
                    repeatType,
                    forkFrom,
                    1 as mode
                FROM Tasks;
            `);

            await execureSQL(`DROP TABLE Tasks;`);
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
                    minimizeNotes INTEGER,
                    calendarMode INTEGER,
                    notesScreenMode INTEGER,
                    passwordResetEmail TEXT
                );
            `);
            await execureSQL(`
                INSERT INTO Settings (
                    defaultNotification,
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
                    minimizeNotes,
                    calendarMode,
                    notesScreenMode
                ) 
                SELECT 
                    defaultNotification, 
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
                    1 as minimizeNotes,
                    1 as calendarMode,
                    1 as notesScreenMode
                FROM Settings_OLD;
            `, [currentSortSettings.type, currentSortSettings.direction, currentSortSettings.finSort]);
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

        async function updateToken( ) {
            let token = JSON.parse(localStorage.getItem(config.LSTokenKey)) || {};
            if (!token || !token.id) {
                return
            }
            token.gdBackup = {
                backupFiles: []
            };
            if (token.backupFile) {
                let backupFile = token.backupFile;
                backupFile.modifiedTime = moment(backupFile.modifiedTime).valueOf();
                token.gdBackup.backupFiles.push(backupFile);
            }
            delete token.backupFile;
            token.settings = {autoBackup: true};
            token.gAccessToken = token.token;
            delete token.token;
            token.gRefreshToken = token.refreshToken;
            delete token.refreshToken;
            token.msGTokenExpireDateUTC = token.tokenExpireDate;
            delete token.tokenExpireDatel;
            localStorage.setItem(config.LSTokenKey, JSON.stringify(token));
        }

        async function convertDatesToUTC() {
            let utcOffset = getUTCOffset();

            await execureSQL(`
                UPDATE Notes
                SET
                    date = CASE date WHEN -1 THEN -1 ELSE date + ${utcOffset} END,
                    startTime = CASE startTime WHEN -1 THEN -1 ELSE startTime + ${utcOffset} END,
                    endTime = CASE endTime WHEN -1 THEN -1 ELSE endTime + ${utcOffset} END,
                    utcOffset = ${utcOffset};
            `);

            let anyRepeatTasksSelect = await execureSQL(`SELECT id from Notes WHERE repeatType = ?`, [NoteRepeatType.Any]);

            if (anyRepeatTasksSelect.rows.length) {
                let anyRepeatTasksIDs = [];
                for(let i = 0; i < anyRepeatTasksSelect.rows.length; i++) {
                    let item = anyRepeatTasksSelect.rows.item(i);
                    anyRepeatTasksIDs.push(item.id);
                }

                await execureSQL(`UPDATE NotesRepeatValues SET value = value + ${utcOffset} WHERE noteId IN (${anyRepeatTasksIDs.join(", ")})`);
            }
        }

        async function addPasswordEncryption() {
            let select = await execureSQL('SELECT password FROM Settings');
            let password = select.rows.item(0).password;
            if (password) {
                await execureSQL('UPDATE Settings SET password = ?', [md5(password)]);
            }
        }
    }
}