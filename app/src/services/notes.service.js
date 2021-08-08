import executeSQL from '../utils/executeSQL';
import moment from 'moment';
import notificationService from "./notification.service";
import getUTCOffset from "../utils/getUTCOffset";
import {NoteAction, NoteMode, NoteRepeatType} from "../constants";
import tagsService from "./tags.service";

window.e = executeSQL;

class NotesService {
    async processSearchResultNotesWithTime(notesIDs) {
        let utcOffset = getUTCOffset();
        let currentDate = moment().startOf("day");

        let select = await executeSQL(
            `SELECT n.id, n.title, n.startTime, n.endTime, n.isNotificationEnabled, n.tag, n.tags,
                        n.repeatType, n.contentItems, n.isFinished, n.forkFrom, n.date, n.manualOrderIndex, n.mode,
                        (select GROUP_CONCAT(rep.value, ',') from NotesRepeatValues rep where rep.noteId = n.id) as repeatValues
                        FROM Notes n
                        WHERE
                            n.id IN (${notesIDs.join(',')})
                            AND n.mode == ?
                            AND n.lastAction != ?`
            , [NoteMode.WithDateTime, NoteAction.Delete]);

        if (!select.rows.length) {
            return [];
        }

        let findClosestValue = (initialValue, data) => {
            let reducer = (prevValue, value, index, array) => {
                if (
                    prevValue === null ||
                    Math.abs(initialValue - value) < Math.abs(initialValue - array[index - 1])
                ) {
                    return value;
                }
                return prevValue;
            };
            return data.reduce(reducer, null);
        }

        let notes = [];
        for(let i = 0; i < select.rows.length; i++) {
            let note = this.parseNoteWithTime(select.rows.item(i), utcOffset);

            if (note.repeatType === NoteRepeatType.Day) {
                note.date = moment(currentDate);
            } else if (note.repeatType === NoteRepeatType.Week) {
                note.date = moment().isoWeekday(findClosestValue(moment(currentDate).isoWeekday(), note.repeatValues));
            } else if (note.repeatType === NoteRepeatType.Any) {
                note.date = moment(findClosestValue(moment(currentDate).valueOf(), note.repeatValues));
            }
            notes.push(note);
        }

        let closestToCurrentDateNoteDateDiff = null;
        let closestToCurrentDateNoteIndex = 0;
        let closestToCurrentDate = null;
        let msCurrentDate = currentDate.valueOf();
        notes.forEach((note, index) => {
            let dateDiff = Math.abs(msCurrentDate - note.date.valueOf());
            if ((dateDiff < closestToCurrentDateNoteDateDiff) || (closestToCurrentDateNoteDateDiff === null)) {
                closestToCurrentDateNoteDateDiff = dateDiff;
                closestToCurrentDateNoteIndex = index;
                closestToCurrentDate = note.date.valueOf();
            }
        });

        notes = notes.slice(closestToCurrentDateNoteIndex - 50, closestToCurrentDateNoteIndex).concat(notes.slice(closestToCurrentDateNoteIndex, closestToCurrentDateNoteIndex + 50));

        let notesByDates = {};
        notes.forEach((note) => {
            let msDate = note.date.valueOf();
            if (!notesByDates[msDate]) {
                notesByDates[msDate] = [];
            }
            notesByDates[msDate].push(note);
        });

        return Object.keys(notesByDates)
            .map((date) => ({
                date: moment(+date),
                items: notesByDates[date],
                isClosestToCurrentDate: +date === +closestToCurrentDate
            }))
            .sort((a, b) => {
                return a.date.valueOf() - b.date.valueOf();
            });
    }

    async processSearchResultNotesWithoutTime(notesIds) {
        let select = await executeSQL(
            `SELECT n.id, n.title, n.startTime, n.endTime, n.isNotificationEnabled, n.tag, n.tags,
                        n.repeatType, n.contentItems, n.isFinished, n.forkFrom, n.date, n.manualOrderIndex, n.mode
                        FROM Notes n
                        WHERE
                            n.id IN (${notesIds.join(',')})
                            AND n.mode == ?
                            AND n.lastAction != ?`
            , [NoteMode.WithoutDateTime, NoteAction.Delete]);

        let notes = [];
        for(let i = 0; i < select.rows.length; i++) {
            notes.push(this.parseNoteWithoutTime(select.rows.item(i)));
        }

        return [{items: notes}];
    }

    async searchNotes(mode, search) {
        search = search.toLowerCase().trim();

        if (!search) {
            return [];
        }

        let allNotesSelect = await executeSQL(`SELECT t.id, t.title, t.contentItems FROM Notes t;`);
        let filteredNotesIDs = [];
        for(let i = 0; i < allNotesSelect.rows.length; i++) {
            let item = allNotesSelect.rows.item(i);

            if (item.title && item.title.toLowerCase().includes(search)) {
                filteredNotesIDs.push(item.id);
                continue;
            }

            if (item.contentItems && item.contentItems.toLowerCase().includes(search)) {
                let contentItems = JSON.parse(item.contentItems);
                if (contentItems.some((f) => f.value && f.value.toLowerCase().includes(search))) {
                    filteredNotesIDs.push(item.id);
                }
            }
        }

        if (mode === NoteMode.WithDateTime) {
            return this.processSearchResultNotesWithTime(filteredNotesIDs);
        } else {
            return this.processSearchResultNotesWithoutTime(filteredNotesIDs);
        }
    }

    parseNoteCommon(note) {
        return {
            contentItems: JSON.parse(note.contentItems),
            isFinished: Boolean(note.isFinished),
            lastActionTime: moment(note.lastActionTime),
            tags: (note.tags ? note.tags.split(",") : []).map((id) => tagsService.tags[id])
        }
    }

    parseNoteWithTime(note, utcOffset) {
        return {
            ...note,
            ...this.parseNoteCommon(note),
            startTime: note.startTime ? moment(note.startTime - utcOffset) : note.startTime,
            endTime: note.endTime ? moment(note.endTime - utcOffset) : note.endTime,
            date: note.date ? moment(note.date - utcOffset) : note.date,
            isNotificationEnabled: Boolean(note.isNotificationEnabled),
            isShadow: Boolean(note.date === null),
            repeatValues: note.repeatValues ? note.repeatValues.split(",").map(a => note.repeatType === NoteRepeatType.Any ? +a - utcOffset : +a) : [],
        };
    }

    parseNoteWithoutTime(note) {
        return {
            ...note,
            ...this.parseNoteCommon(note)
        }
    }

    async getNotesWithTime(dates) {
        let utcOffset = getUTCOffset();

        let selects = await Promise.all(
            dates.map((date) => {
                let msDateUTC = date.valueOf() + utcOffset;
                return executeSQL(
                    `SELECT n.id, n.title, n.startTime, n.endTime, n.isNotificationEnabled, n.tag, n.repeatType, n.tags,
                    n.contentItems, n.isFinished, n.forkFrom, n.manualOrderIndex, n.date, n.mode, n.lastAction, n.lastActionTime,
                    (select GROUP_CONCAT(rep.value, ',') from NotesRepeatValues rep where rep.noteId = n.id) as repeatValues
                    FROM Notes n
                    LEFT JOIN NotesRepeatValues rep ON n.id = rep.noteId
                    WHERE
                        n.lastAction != ?
                        AND (
                            n.date = ?
                            OR (
                                n.date IS NULL AND NOT EXISTS (SELECT forkFrom FROM Notes WHERE forkFrom = n.id AND date = ?)
                                AND (
                                    n.repeatType = ?
                                    OR (n.repeatType = ? AND rep.value = ?)
                                    OR (n.repeatType = ? AND rep.value = ?)
                                )
                            )
                        )
                        AND n.mode == ?;`,
                    [NoteAction.Delete, msDateUTC, msDateUTC, NoteRepeatType.Day, NoteRepeatType.Week, date.isoWeekday(), NoteRepeatType.Any, msDateUTC, NoteMode.WithDateTime]
                );
            })
        );

        let result = selects.map((select, selectIndex) => {
            let notes = [];
            for(let i = 0; i < select.rows.length; i++) {
                let note = this.parseNoteWithTime(select.rows.item(i), utcOffset);
                note.date = moment(dates[selectIndex].valueOf());
                notes.push(note);
            }

            return {
                date: dates[selectIndex],
                items: notes
            }
        });

        return result;
    }

    async getNotesWithoutTime() {
        let select = await executeSQL(
            `SELECT id, title, tag, contentItems, manualOrderIndex, mode, isFinished, lastAction, lastActionTime, 
            repeatType, forkFrom, tags
            FROM Notes
            WHERE
                mode == ?
                AND lastAction != ?`,
            [NoteMode.WithoutDateTime, NoteAction.Delete]
        );

        let notes = [];
        for(let i = 0; i < select.rows.length; i++) {
            notes.push(this.parseNoteWithoutTime(select.rows.item(i)));
        }

        return [{ items: notes }];
    }

    async getNotes(mode, dates) {
        if (mode === NoteMode.WithDateTime) {
            return this.getNotesWithTime(dates);
        } else {
            return this.getNotesWithoutTime();
        }
    }

    async addNote(note) {
        let nextNote = {
            ...note,
            forkFrom: null,
            isShadow: note.repeatType !== NoteRepeatType.NoRepeat,
            manualOrderIndex: null
        };

        let noteId = await this.insertNote(nextNote);
        nextNote.id = noteId;

        nextNote = await this.updateNoteLastAction(NoteAction.Add, nextNote);

        await this.addNoteRepeatValues(nextNote);

        nextNote.isNotificationEnabled && notificationService.set(nextNote);

        return nextNote;
    }

    async insertNote(note) {
        let utcOffset = getUTCOffset();

        let insert = await executeSQL(
            `INSERT INTO Notes
            (title, startTime, endTime, isNotificationEnabled, tag, repeatType, contentItems, isFinished, date, forkFrom, mode, manualOrderIndex, tags)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
                note.title,
                note.startTime ? note.startTime.valueOf() + utcOffset : note.startTime,
                note.endTime ? note.endTime.valueOf() + utcOffset : note.endTime,
                Number(note.isNotificationEnabled),
                note.tag,
                note.repeatType,
                JSON.stringify(note.contentItems),
                Number(note.isFinished),
                note.date ? note.date.valueOf() + utcOffset : note.date,
                note.forkFrom,
                note.mode,
                note.manualOrderIndex,
                note.tags.map((tag) => tag.id).join(",")
            ]
        );

        return insert.insertId;
    }

    async addNoteRepeatValues(note) {
        let utcOffset = getUTCOffset();

        await executeSQL(`DELETE FROM NotesRepeatValues WHERE noteId = ?`, [ note.id ]);

        if (note.repeatType === NoteRepeatType.NoRepeat || note.repeatValues.length === 0) {
            return
        }

        let params = note.repeatValues.reduce((acc) => `${acc}, (?, ?)`, "");
        params = params.slice(2);
        let values = note.repeatValues.reduce((acc, item) => {
            let value = item;
            if (note.repeatType === NoteRepeatType.Any) {
                value = item + utcOffset;
            }
            return [...acc, note.id, value]
        }, []);

        await executeSQL(`
            INSERT INTO NotesRepeatValues
            (noteId, value)
            VALUES
            ${params};
        `, values);
    }

    async updateNoteDynamic(note, nextData) {
        let nextNote = {...note, ...nextData};

        if (nextNote.isShadow) {
            nextNote = await this.formShadowToReal(nextNote);
        }

        await executeSQL(
            `UPDATE Notes
            SET 
                contentItems = ?,
                isFinished = ?
            WHERE id = ?;`,
            [
                JSON.stringify(nextNote.contentItems),
                Number(nextNote.isFinished),
                nextNote.id
            ]
        );

        nextNote = await this.updateNoteLastAction(NoteAction.Edit, nextNote);

        return nextNote;
    }

    async updateNote(note, prevNote) {
        let utcOffset = getUTCOffset();

        let nextNote = {...note};
        if (prevNote.repeatType !== NoteRepeatType.NoRepeat) {
            if (!nextNote.isShadow) {
                nextNote.id = nextNote.forkFrom;
            }
            await executeSQL(`DELETE FROM Notes WHERE forkFrom = ?`, [nextNote.id]);
        }
        nextNote.isShadow = nextNote.repeatType !== NoteRepeatType.NoRepeat;
        nextNote.forkFrom = null;
        nextNote.isFinished = false;

        if (!note.isShadow) {
            nextNote.manualOrderIndex = null;
        }

        await executeSQL(
            `UPDATE Notes
            SET title = ?, date = ?, startTime = ?, endTime = ?, isNotificationEnabled = ?, tag = ?, repeatType = ?, 
                contentItems = ?, isFinished = ?, manualOrderIndex = ?, tags = ?
            WHERE id = ?;`,
            [
                nextNote.title,
                nextNote.date ? (nextNote.isShadow ? null : nextNote.date.valueOf() + utcOffset) : null,
                nextNote.startTime ? nextNote.startTime.valueOf() + utcOffset : nextNote.startTime,
                nextNote.endTime ? nextNote.endTime.valueOf() + utcOffset : nextNote.endTime,
                Number(nextNote.isNotificationEnabled),
                nextNote.tag,
                nextNote.repeatType,
                JSON.stringify(nextNote.contentItems),
                Number(nextNote.isFinished),
                nextNote.manualOrderIndex,
                note.tags.map((tag) => tag.id).join(","),
                nextNote.id,
            ]
        );

        await this.addNoteRepeatValues(nextNote);

        nextNote = await this.updateNoteLastAction(NoteAction.Edit, nextNote);

        notificationService.clear({...prevNote, id: nextNote.id});
        nextNote.isNotificationEnabled && notificationService.set(nextNote);

        return nextNote;
    }

    async deleteNote(note) {
        let nextNote = {...note};
        if (nextNote.repeatType !== NoteRepeatType.NoRepeat && !nextNote.isShadow) {
            nextNote = this.fromRealToShadow(nextNote);
        }

        await executeSQL(`
            UPDATE Notes
            SET manualOrderIndex = ?
            WHERE id = ? OR forkFrom = ?;
        `,
            [
                null,
                nextNote.id,
                nextNote.id
            ]
        );

        nextNote = await this.updateNoteLastAction(NoteAction.Delete, nextNote);

        notificationService.clear(nextNote);

        return nextNote;
    }

    async getDeletedNotes() {
        let utcOffset = getUTCOffset();

        let select = await executeSQL(
            `SELECT id, title, startTime, endTime, isNotificationEnabled, tag, repeatType, 
                contentItems, isFinished, forkFrom, manualOrderIndex, lastActionTime, date
            FROM Notes n
            WHERE lastAction = ? AND
            forkFrom IS NULL
            ORDER BY lastActionTime
            LIMIT 100;`
        , [NoteAction.Delete]);

        let notes = [];
        for(let i = 0; i < select.rows.length; i++) {
            notes.push(this.parseNoteWithTime(select.rows.item(i), utcOffset));
        }

        return notes;
    }

    async restoreNote(note) {
        let nextNote = {
            ...note,
            isShadow: note.date === null
        };

        nextNote = await this.updateNoteLastAction(NoteAction.Edit, nextNote);

        nextNote.isNotificationEnabled && notificationService.set(nextNote);

        return nextNote;
    }

    async removeDeletedNotes(untilDate) {
        await executeSQL(`
            DELETE FROM NotesRepeatValues
            WHERE noteId IN (
                SELECT noteId FROM NotesRepeatValues
                LEFT JOIN Notes ON NotesRepeatValues.noteId = Notes.id
                WHERE lastAction = ?${untilDate ? ' AND lastActionTime <= ?' : ''}
            );
        `, [NoteAction.Delete, ...(untilDate ? [untilDate] : [])]);

        return executeSQL(`
            DELETE FROM Notes 
            WHERE lastAction = ?${untilDate ? ' AND lastActionTime <= ?' : ''}
        `, [NoteAction.Delete, ...(untilDate ? [untilDate] : [])]);
    }

    async updateNotesManualSortIndex(notes) {
        let nextNotes = notes.slice();
        let notesInserted = [];
        for (let note of nextNotes) {
            if (note.isShadow) {
                note = await this.formShadowToReal(note);
                notesInserted.push(note);
            }
        }

        const values = notes.reduce((acc, val) => [...acc, val.id, val.manualOrderIndex], []);
        const valuesPlaces = notes.reduce((acc) => [...acc, '(?, ?)'], []).join(", ");

        let sql = `
            WITH Tmp (id, manualOrderIndex) AS (VALUES ${valuesPlaces})
            UPDATE Notes SET manualOrderIndex = (SELECT manualOrderIndex FROM Tmp WHERE Notes.id = Tmp.id) WHERE id IN (SELECT id FROM Tmp);
        `;
        await executeSQL(sql, values);

        return notesInserted;
    }

    async deleteNotesTag(tagId) {
        let select = await executeSQL(`SELECT id, tags FROM Notes;`);

        let nextNotes = [];
        for(let i = 0; i < select.rows.length; i++) {
            let note = select.rows.item(i);
            if (note.tags && note.tags.split(",").filter((_tagId) => Number(_tagId) === tagId).length > 0) {
                note.tags = note.tags.split(",").filter((_tagId) => Number(_tagId) !== tagId).join(",");
                nextNotes.push(note);
            }
        }

        if (nextNotes.length) {
            await executeSQL(`
                UPDATE Notes
                SET tags = CASE id
                    ${nextNotes.map((note) => `WHEN ${note.id} THEN "${note.tags}"`).join(" ")}
                    ELSE tags
                END
                WHERE id IN(${nextNotes.map((note) => note.id).join(",")});
            `);
        }
    }

    async updateNoteLastAction(actionType, note) {
        let nextNote = {
            ...note,
            lastAction: actionType,
            lastActionTime: moment().valueOf()
        };

        await executeSQL(`
            UPDATE Notes
            SET
                lastAction = ?,
                lastActionTime = ?
            WHERE id = ? OR forkFrom = ?;
        `,
            [
                nextNote.lastAction,
                nextNote.lastActionTime,
                nextNote.id,
                nextNote.id
            ]
        );

        return nextNote;
    }

    async formShadowToReal(note) {
        let nextNote = {
            ...note,
            forkFrom: note.id,
            isShadow: false,
        };

        let noteId = await this.insertNote(nextNote);
        nextNote.id = noteId;

        return nextNote;
    }

    fromRealToShadow(note) {
        let nextNote = {
            ...note,
            id: note.forkFrom,
            isShadow: true,
            forkFrom: null,
            manualOrderIndex: null
        };

        return nextNote;
    }

    tags = [
        'transparent',
        '#00213C',
        '#c5282f',
        '#62A178',
        '#3498DB',
        '#BF0FB9',
        '#9A6B00',
        '#9CECC5',
        '#e2dd2d',
        '#e23494',
        '#7e17dc',
        '#333',
        "#bfbfbf"
    ];

    repeatOptions = [
        { val: NoteRepeatType.NoRepeat, translateId: "repeat-type-no-repeat" },
        { val: NoteRepeatType.Day, translateId: "repeat-type-day" },
        { val: NoteRepeatType.Week, translateId: "repeat-type-week" },
        { val: NoteRepeatType.Any, translateId: "repeat-type-any" }
    ];

    weekRepeatOptions = [
        { val: 1, translateId: "monday" },
        { val: 2, translateId: "tuesday" },
        { val: 3, translateId: "wednesday" },
        { val: 4, translateId: "thursday" },
        { val: 5, translateId: "friday" },
        { val: 6, translateId: "saturday" },
        { val: 7, translateId: "sunday" }
    ];

    getTags() {
        return [...this.tags];
    }

    getTagByIndex(index) {
        return this.tags[index];
    }

    getRepeatTypeOptions() {
        return [...this.repeatOptions]
    }

    getWeekRepeatOptions() {
        return [...this.weekRepeatOptions]
    }
}

let noteService = new NotesService();

export default noteService;