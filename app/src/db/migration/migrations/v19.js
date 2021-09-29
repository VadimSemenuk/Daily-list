import executeSQL from "../../../utils/executeSQL";
import moment from "moment";
import {convertLocalDateTimeToUTC} from "../../../utils/convertDateTimeLocale";

export default {
    name: "1.9",

    async run(isUpdate, lastMigrationName) {
        await updateNotesDates();
        await updateAnyRepeatNotesDates();

        function getCorrectedDate(date) {
            let _date = moment.utc(date);
            if (_date.hour() >= 13) {
                _date.add(1, "day");
            }
            return convertLocalDateTimeToUTC(_date).valueOf();
        }

        function isDateValid(date) {
            let _date = moment.utc(date);
            return _date.hour() === 0 && _date.minute() === 0 && _date.second() === 0 && _date.millisecond() === 0
        }

        async function updateNotesDates() {
            let select = await executeSQL(`SELECT id, date from Notes WHERE repeatType = ? OR forkFrom IS NOT NULL;`, ["no-repeat"]);

            let nextNotes = [];
            for(let i = 0; i < select.rows.length; i++) {
                let item = select.rows.item(i);

                if (isDateValid(item.date)) {
                    continue;
                }

                let note = {
                    id: item.id,
                    date: getCorrectedDate(item.date)
                };

                nextNotes.push(note);
            }

            if (!nextNotes.length) {
                return;
            }

            let sql = `
            UPDATE Notes 
            SET date = CASE id 
                ${nextNotes.map((note) => `WHEN ${note.id} THEN "${note.date}"`).join(" ")}
                ELSE date
            END
            WHERE id IN(${nextNotes.map((note) => note.id).join(",")})
            `;

            await executeSQL(sql);
        }

        async function updateAnyRepeatNotesDates() {
            let select = await executeSQL(`SELECT n.id, (SELECT GROUP_CONCAT(rep.value, ',') FROM NotesRepeatValues rep WHERE rep.noteId = n.id) as repeatValues from Notes n WHERE n.repeatType = ?;`, ["any"]);

            let nextNotes = [];
            for(let i = 0; i < select.rows.length; i++) {
                let item = select.rows.item(i);

                let repeatValues = item.repeatValues ? item.repeatValues.split(",").map((item) => Number(item)) : [];
                let invalidItems = repeatValues.filter((item) => !isDateValid(item));
                if (!repeatValues.length || invalidItems.length === 0) {
                    continue;
                }

                let note = {
                    id: item.id,
                    repeatValues: repeatValues.map(a => getCorrectedDate(a))
                };

                nextNotes.push(note);
            }

            if (!nextNotes.length) {
                return;
            }

            let nextRepeatValues = [];
            nextNotes.forEach((note) => {
                if (!note.repeatValues || !note.repeatValues.length) {
                    return;
                }

                note.repeatValues.forEach((item) => {
                    nextRepeatValues.push({
                        noteId: note.id,
                        value: item
                    });
                });
            });

            if (!nextRepeatValues.length) {
                return;
            }

            await executeSQL(`DELETE FROM NotesRepeatValues WHERE noteId IN(${nextNotes.map((note) => note.id).join(",")})`);

            let sql = `
            INSERT INTO NotesRepeatValues
            (noteId, value)
            VALUES
            ${nextRepeatValues.map((item) => `(${item.noteId},${item.value})`).join(",")};
            `;

            await executeSQL(sql);
        }
    }
}