import executeSQL from "../../../utils/executeSQL";
import noteService from "../../../services/notes.service";
import {NoteAction, NoteContentItemType, NoteRepeatType, NotesScreenMode} from "../../../constants";
import getDefaultLanguage from "../../../utils/getDefaultLanguage";
import i18n from "../../../i18n";
import {convertLocalDateTimeToUTC} from "../../../utils/convertDateTimeLocale";
import moment from "moment";
import NoteDragHelp from "../../../assets/img/note-drag-help.png";

export default {
    name: "1.8",

    async run(isUpdate, lastMigrationName) {
        await parseClickableItems();

        if (isUpdate && lastMigrationName === "1.7") {
            await addUpdatesNote();
        }

        async function parseClickableItems() {
            let select = await executeSQL(`
                SELECT id, contentItems
                FROM Notes;
            `);

            let notes = [];
            for(let i = 0; i < select.rows.length; i++) {
                notes.push(select.rows.item(i));
            }

            for(let note of notes) {
                note.contentItems = note.contentItems ? JSON.parse(note.contentItems) : [];

                let update = false;
                for (let contentItem of note.contentItems) {
                    if (
                        contentItem.type === NoteContentItemType.ListItem
                        || contentItem.type === NoteContentItemType.Text
                    ) {
                        if (
                            noteService.emailMath.test(contentItem.value)
                            || noteService.phoneMatch.test(contentItem.value)
                            || noteService.urlMatch.test(contentItem.value)
                        ) {
                            note.contentItems = noteService.parseNoteContentItems(note.contentItems);

                            update = true;
                        }
                    }
                }

                if (update) {
                    await executeSQL(`
                        UPDATE Notes
                        SET contentItems = ?
                        WHERE id = ?
                    `, [JSON.stringify(note.contentItems), note.id]);
                }
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