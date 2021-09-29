import executeSQL from "../../../utils/executeSQL";
import {
    NoteAction,
    NoteRepeatType,
    NotesScreenMode
} from "../../../constants";
import getDefaultLanguage from "../../../utils/getDefaultLanguage";
import i18n from "../../../i18n";
import {convertLocalDateTimeToUTC} from "../../../utils/convertDateTimeLocale";
import moment from "moment";
import NoteDragHelp from "../../../assets/img/note-drag-help.png";

export default {
    name: "1.10",

    async run(isUpdate, lastMigrationName) {
        await alterSettingsTable();

        if (isUpdate && lastMigrationName === "1.7") {
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
                    passwordInputType TEXT
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
                    passwordInputType
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
                    'text' as passwordInputType
                FROM Settings_OLD;
            `);
            await executeSQL(`DROP TABLE Settings_OLD;`);
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