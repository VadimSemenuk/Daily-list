import executeSQL from "../../../utils/executeSQL";
import {
    NoteAction,
    NoteRepeatType,
    NotesScreenMode
} from "../../../constants";
import getDefaultLanguage from "../../../utils/getDefaultLanguage";
import i18n from "../../../i18n";
import {convertLocalDateTimeToUTC, convertUTCDateTimeToLocal} from "../../../utils/convertDateTimeLocale";
import moment from "moment";
import NoteDragHelp from "../../../assets/img/note-drag-help.png";
import {getTime} from "../../../utils/timeFromDateTime";

export default {
    name: "1.10",

    async run(isUpdate, lastMigrationName) {
        await alterSettingsTable();
        await alterNotesTable();
        await updateNoteStartEndTime();

        if (isUpdate) {
            // await addUpdatesNote();
        }

        async function alterSettingsTable() {
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
                    isQuickAddPanelVisible INTEGER,
                    autoMoveNotFinishedNotes INTEGER,
                    passwordInputType TEXT,
                    showNotificationForFinishedNotes INTEGER
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
                    isQuickAddPanelVisible,
                    autoMoveNotFinishedNotes,
                    passwordInputType,
                    showNotificationForFinishedNotes
                ) 
                SELECT 
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
                    isQuickAddPanelVisible,
                    0 as autoMoveNotFinishedNotes,
                    'text' as passwordInputType,
                    0 as showNotificationForFinishedNotes
                FROM Settings_OLD;
            `);
            await executeSQL(`DROP TABLE Settings_OLD;`);
        }

        async function alterNotesTable() {
            await executeSQL(`ALTER TABLE Notes RENAME TO Notes_OLD;`);

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
                    repeatItemDate INTEGER,
                    repeatStartDate INTEGER,
                    repeatEndDate INTEGER,
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
                    repeatItemDate,
                    repeatStartDate,
                    repeatEndDate,
                    forkFrom,
                    mode,
                    manualOrderIndex,
                    tags
                ) 
                SELECT
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
                    CASE
                        WHEN forkFrom IS NULL THEN null ELSE date
                    END AS repeatItemDate,
                    null as repeatStartDate,
                    null as repeatEndDate,
                    forkFrom,
                    mode,
                    manualOrderIndex,
                    tags
                FROM Notes_OLD;
            `);

            await executeSQL(`DROP TABLE Notes_OLD;`);
        }

        async function updateNoteStartEndTime() {
            let select = await executeSQL(`SELECT id, startTime, endTime from Notes WHERE startTime IS NOT NULL OR endTime IS NOT NULL;`);

            let startTimeData = [];
            let endTimeData = [];
            for(let i = 0; i < select.rows.length; i++) {
                let item = select.rows.item(i);

                if (item.startTime !== null) {
                    startTimeData.push({
                        id: item.id,
                        startTime: convertLocalDateTimeToUTC(getTime(convertUTCDateTimeToLocal(item.startTime, "minute")), "minute").valueOf()
                    });
                }

                if (item.endTime !== null) {
                    endTimeData.push({
                        id: item.id,
                        endTime: convertLocalDateTimeToUTC(getTime(convertUTCDateTimeToLocal(item.endTime, "minute")), "minute").valueOf()
                    });
                }
            }

            if (startTimeData.length !== 0) {
                let sql = `
                    UPDATE Notes
                    SET startTime = CASE id
                    ${startTimeData.map((dataItem) => `WHEN ${dataItem.id} THEN "${dataItem.startTime}"`).join(" ")}
                    ELSE startTime
                    END
                    WHERE id IN(${startTimeData.map((dataItem) => dataItem.id).join(",")})
                `;

                await executeSQL(sql);
            }

            if (endTimeData.length !== 0) {
                let sql = `
                    UPDATE Notes
                    SET endTime = CASE id
                    ${endTimeData.map((dataItem) => `WHEN ${dataItem.id} THEN "${dataItem.endTime}"`).join(" ")}
                    ELSE endTime
                    END
                    WHERE id IN(${endTimeData.map((dataItem) => dataItem.id).join(",")})
                `;

                await executeSQL(sql);
            }
        }

        async function addUpdatesNote() {
            let lang = getDefaultLanguage();
            let translator = i18n.init(lang);

            let note = {
                isNotificationEnabled: false,
                startTime: null,
                endTime: null,
                date: convertLocalDateTimeToUTC(moment().startOf("day").valueOf()).valueOf(),
                isFinished: false,
                repeatType: NoteRepeatType.NoRepeat,
                mode: NotesScreenMode.WithDateTime,
                tags: [],
                tag: "#62A178",
                forkFrom: null,
                isShadow: false,
                manualOrderIndex: null,
                title: translator.t("updates-v1.8-note-title"),
                contentItems: [
                    {
                        type: "text",
                        value: translator.t("updates-v1.8-note-ci-1")
                    },
                    {
                        type: "text",
                        value: translator.t("updates-v1.8-note-ci-2")
                    },
                    {
                        type: "text",
                        value: translator.t("updates-v1.8-note-ci-3")
                    },
                    {
                        type: "snapshot",
                        value: NoteDragHelp
                    },
                    {
                        type: "text",
                        value: translator.t("updates-v1.8-note-ci-4")
                    },
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