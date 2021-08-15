import moment from "moment";
import md5 from "md5";

import executeSQL from "../../../utils/executeSQL";
import config from "../../../config/config";
import {NoteRepeatType, CalendarNotesCounterMode, NotesScreenMode, NoteAction} from "../../../constants";
import getDefaultLanguage from "../../../utils/getDefaultLanguage";
import i18n from "../../../i18n";
import {convertLocalDateTimeToUTC} from "../../../utils/convertDateTimeLocale";

export default {
    name: "1.7",

    async run(isUpdate) {
        await alterTasksRepeatValuesTable();
        await addMetaTable();
        await alterTasksTable();
        await alterSettingsTable();
        await addErrorsLogsTable();
        await addLoadsLogsTable();
        await updateToken();
        await convertDatesToUTC();
        await addPasswordEncryption();
        await addTagsPage();

        if (isUpdate) {
            await addUpdatesNote();
        }

        async function alterTasksRepeatValuesTable () {
            await executeSQL(`
                CREATE TABLE IF NOT EXISTS NotesRepeatValues
                (   
                    noteId INTEGER,
                    value INTEGER,
                    FOREIGN KEY(noteId) REFERENCES Notes(id)
                );
            `);

            await executeSQL(`
                INSERT INTO NotesRepeatValues (noteId, value) 
                SELECT taskId, value FROM TasksRepeatValues;
            `);

            await executeSQL(`DROP TABLE TasksRepeatValues`);
        }

        async function addMetaTable () {
            await executeSQL(`ALTER TABLE MetaInfo RENAME TO MetaInfo_OLD;`);

            await executeSQL(`
                CREATE TABLE IF NOT EXISTS MetaInfo
                (   
                    isRateDialogShowed INTEGER,
                    appInstallDate INTEGER
                );
            `);

            await executeSQL(`
                INSERT INTO MetaInfo (isRateDialogShowed, appInstallDate)
                SELECT 
                    0 as isRateDialogShowed,
                    ? as appInstallDate
                FROM MetaInfo_OLD
            `, [moment().startOf("day").valueOf()]);

            await executeSQL(`DROP TABLE MetaInfo_OLD;`);
        }

        async function alterTasksTable () {
            await executeSQL(`                           
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
                    tags TEXT,
                    UNIQUE (id) ON CONFLICT REPLACE
                );
            `);

            await executeSQL(`
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
                    mode,
                    manualOrderIndex,
                    tags
                ) 
                SELECT
                    id, 
                    title, 
                    added as date,
                    finished as isFinished,
                    dynamicFields as contentItems,
                    CASE
                        WHEN startTime = -1 THEN null ELSE startTime
                    END AS startTime,
                    CASE
                        WHEN endTime = -1 THEN null ELSE endTime
                    END AS endTime,
                    notificate as isNotificationEnabled, 
                    tag, 
                    lastAction,
                    lastActionTime,
                    repeatType,
                    CASE
                        WHEN forkFrom = -1 THEN null ELSE forkFrom
                    END AS forkFrom,
                    1 as mode,
                    null as manualOrderIndex,
                    "" as tags
                FROM Tasks;
            `);

            await executeSQL(`DROP TABLE Tasks;`);
        }

        async function alterSettingsTable () {
            let select = await executeSQL(`SELECT sort FROM Settings;`);
            let selectItems = select.rows.item(0);

            let oldSortSettings = (selectItems && selectItems.sort) ? JSON.parse(selectItems.sort) : null;
            let settingsMatch = {
                type: {
                    0: 1,
                    1: 2
                },
                direction: {
                    0: 1,
                    1: 2
                }
            }

            let sortSettings = {
                type: oldSortSettings ? settingsMatch.type[oldSortSettings.type] : 2,
                direction: oldSortSettings ? settingsMatch.direction[oldSortSettings.direction] : 2,
                finSort: 1
            }

            let noteFiltersSettings = {
                tags: []
            }

            await executeSQL(`ALTER TABLE Settings RENAME TO Settings_OLD;`);
            await executeSQL(`                           
                CREATE TABLE IF NOT EXISTS Settings
                (
                    defaultNotification INTEGER,
                    theme INTEGER,
                    password TEXT,    
                    fontSize INTEGER,
                    notesShowInterval INTEGER,
                    lang TEXT,
                    calendarNotesCounterMode INTEGER,
                    sortType INTEGER,
                    sortDirection INTEGER,
                    sortFinBehaviour INTEGER,
                    minimizeNotes INTEGER,
                    calendarMode INTEGER,
                    notesScreenMode INTEGER,
                    passwordResetEmail TEXT,
                    invertHeaderPosition INTEGER,
                    noteFilters TEXT,
                    isSidenavTagsListExpanded INTEGER,
                    isQuickAddPanelVisible INTEGER,
                    isNoteSubmitButtonAvailable INTEGER
                );
            `);
            await executeSQL(`
                INSERT INTO Settings (
                    defaultNotification,
                    theme,
                    password,    
                    fontSize,
                    notesShowInterval,
                    lang,
                    calendarNotesCounterMode,
                    sortType,
                    sortDirection,
                    sortFinBehaviour,
                    minimizeNotes,
                    calendarMode,
                    notesScreenMode,
                    invertHeaderPosition,
                    noteFilters,
                    isSidenavTagsListExpanded,
                    isQuickAddPanelVisible,
                    isNoteSubmitButtonAvailable
                ) 
                SELECT 
                    defaultNotification, 
                    theme, 
                    password,
                    CASE
                        WHEN fontSize = 14 THEN 15 ELSE fontSize
                    END AS fontSize, 
                    notesShowInterval, 
                    lang,
                    ? as calendarNotesCounterMode,
                    ? as sortType,
                    ? as sortDirection,
                    ? as sortFinBehaviour,
                    1 as minimizeNotes,
                    1 as calendarMode,
                    1 as notesScreenMode,
                    0 as invertHeaderPosition,
                    ? as noteFilters,
                    1 as isSidenavTagsListExpanded,
                    fastAdd as isQuickAddPanelVisible,
                    0 as isNoteSubmitButtonAvailable
                FROM Settings_OLD;
            `, [CalendarNotesCounterMode.All, sortSettings.type, sortSettings.direction, sortSettings.finSort, JSON.stringify(noteFiltersSettings)]);
            await executeSQL(`DROP TABLE Settings_OLD;`);
        }

        async function addErrorsLogsTable () {
            await executeSQL(`
                CREATE TABLE IF NOT EXISTS ErrorLogs
                (
                    date INTEGER,
                    message TEXT,
                    deviceId TEXT
                );
            `);
        }

        async function addLoadsLogsTable () {
            await executeSQL(`
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
            let utcOffset = moment().utcOffset() * 60 * 1000;

            await executeSQL(`
                UPDATE Notes
                SET
                    date = CASE date WHEN -1 THEN -1 ELSE date + ${utcOffset} END,
                    startTime = CASE startTime WHEN -1 THEN -1 ELSE startTime + ${utcOffset} END,
                    endTime = CASE endTime WHEN -1 THEN -1 ELSE endTime + ${utcOffset} END;
            `);

            let anyRepeatTasksSelect = await executeSQL(`SELECT id from Notes WHERE repeatType = ?`, [NoteRepeatType.Any]);

            if (anyRepeatTasksSelect.rows.length) {
                let anyRepeatTasksIDs = [];
                for(let i = 0; i < anyRepeatTasksSelect.rows.length; i++) {
                    let item = anyRepeatTasksSelect.rows.item(i);
                    anyRepeatTasksIDs.push(item.id);
                }

                await executeSQL(`UPDATE NotesRepeatValues SET value = value + ${utcOffset} WHERE noteId IN (${anyRepeatTasksIDs.join(", ")})`);
            }
        }

        async function addPasswordEncryption() {
            let select = await executeSQL('SELECT password FROM Settings');
            let password = select.rows.item(0).password;
            if (password) {
                await executeSQL('UPDATE Settings SET password = ?', [md5(password)]);
            }
        }

        async function addTagsPage() {
            await executeSQL(`
                CREATE TABLE IF NOT EXISTS Tags
                (
                    id INTEGER PRIMARY KEY,
                    name Text
                );
            `);

            let lang = getDefaultLanguage();
            let translator = i18n.init(lang);

            await executeSQL(`
                INSERT INTO Tags (name)
                VALUES 
                (?),
                (?),
                (?);
            `, [translator.t("initial-tag-1"), translator.t("initial-tag-2"), translator.t("initial-tag-3")]);
        }

        async function addUpdatesNote() {
            let lang = getDefaultLanguage();
            let translator = i18n.init(lang);

            let note = {
                isNotificationEnabled: false,
                startTime: null,
                endTime: null,
                date: convertLocalDateTimeToUTC(moment().startOf("day").valueOf()),
                isFinished: false,
                repeatType: NoteRepeatType.NoRepeat,
                mode: NotesScreenMode.WithDateTime,
                tags: [],
                tag: "#c5282f",
                forkFrom: null,
                isShadow: false,
                manualOrderIndex: null,
                title: translator.t("updates-note-title"),
                contentItems: [
                    {
                        type: "text",
                        value: translator.t("updates-note-ci-1")
                    },
                    {
                        type: "text",
                        value: translator.t("updates-note-ci-2")
                    },
                    {
                        type: "text",
                        value: translator.t("updates-note-ci-3")
                    }
                ],
            }

            await executeSQL(
                `INSERT INTO Notes
            (title, startTime, endTime, isNotificationEnabled, tag, repeatType, contentItems, isFinished, date, forkFrom, mode, manualOrderIndex, tags, lastAction, lastActionTime)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                [
                    note.title,
                    note.startTime,
                    note.endTime,
                    Number(note.isNotificationEnabled),
                    note.tag,
                    note.repeatType,
                    JSON.stringify(note.contentItems),
                    Number(note.isFinished),
                    note.date,
                    note.forkFrom,
                    note.mode,
                    note.manualOrderIndex,
                    note.tags.map((tag) => tag.id).join(","),
                    NoteAction.Add,
                    moment().valueOf()
                ]
            );
        }
    }
}