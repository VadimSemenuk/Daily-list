import executeSQL from "../../../utils/executeSQL";
import noteService from "../../../services/notes.service";
import {NoteContentItemType} from "../../../constants";

export default {
    name: "1.8",

    async run(isUpdate, lastMigrationName) {
        await parseClickableItems();

        if (!isUpdate && lastMigrationName === "1.7") {
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
            return null;
        }
    }
}