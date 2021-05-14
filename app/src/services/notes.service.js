import executeSQL from '../utils/executeSQL';
import moment from 'moment';
import notificationService from "./notification.service";
import getUTCOffset from "../utils/getUTCOffset";
import {NoteAction, NoteMode, NoteRepeatType} from "../constants";

window.e = executeSQL;

class NotesService {
    async searchNotes(mode, search, repeatType) {
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

        if (mode === 1) {
            let msCurrentDate = moment().startOf("day").valueOf();

            let select = await executeSQL(
                `SELECT t.id, t.title, t.startTime, t.endTime, t.isNotificationEnabled, t.tag, 
                        t.repeatType, t.contentItems, t.isFinished, t.forkFrom, t.date, t.manualOrderIndex, t.mode,
                        (select GROUP_CONCAT(rep.value, ',') from NotesRepeatValues rep where rep.noteId = t.id) as repeatDates
                        FROM Notes t
                        WHERE
                            t.id IN (${filteredNotesIDs.join(',')})
                            AND ${repeatType === 'no-repeat' ? `(t.repeatType == 'no-repeat' OR t.repeatType == 'any')` : `((t.repeatType == 'week' OR t.repeatType == 'day') AND t.forkFrom == -1)`}
                            AND t.mode == 1
                            AND t.lastAction != ?
                        ORDER BY t.date`
                    , [NoteAction.Delete]);

            if (!select.rows.length) {
                return [];
            }

            let notes = [];
            let closestToCurrentDateNoteDateDiff = null;
            let closestToCurrentDateNoteIndex = 0;
            let closestToCurrentDate = null;
            for(let i = 0; i < select.rows.length; i++) {
                let item = select.rows.item(i);

                let nextItem = {
                    ...item,
                    contentItems: JSON.parse(item.contentItems),
                    startTime: ~item.startTime ? moment(item.startTime - getUTCOffset()) : false,
                    endTime: ~item.endTime ? moment(item.endTime - getUTCOffset()) : false,
                    date: moment(item.date - getUTCOffset()),
                    msAdded: item.date - getUTCOffset(),
                    isFinished: Boolean(item.isFinished),
                    isNotificationEnabled: Boolean(item.isNotificationEnabled),
                    isShadow: Boolean(item.date === -1),
                    repeatDates: item.repeatDates ? item.repeatDates.split(",").map(a => item.repeatType === NoteRepeatType.Any ? +a - getUTCOffset() : +a) : [],
                };

                if (repeatType === "no-repeat") {
                    let dateDiff = Math.abs(msCurrentDate - nextItem.msAdded);
                    if ((dateDiff < closestToCurrentDateNoteDateDiff) || (closestToCurrentDateNoteDateDiff === null)) {
                        closestToCurrentDateNoteDateDiff = dateDiff;
                        closestToCurrentDateNoteIndex = i;
                        closestToCurrentDate = nextItem.msAdded;
                    }
                }

                notes.push(nextItem);
            }

            if (repeatType === "no-repeat") {
                notes = notes.slice(closestToCurrentDateNoteIndex - 50, closestToCurrentDateNoteIndex).concat(notes.slice(closestToCurrentDateNoteIndex, closestToCurrentDateNoteIndex + 50));

                let notesByDates = {};
                notes.forEach((note) => {
                    if (!notesByDates[note.msAdded]) {
                        notesByDates[note.msAdded] = [note];
                    } else {
                        notesByDates[note.msAdded].push(note);
                    }
                });

                return Object.keys(notesByDates).map((date) => ({
                    date: moment(+date),
                    items: notesByDates[date],
                    isClosestToCurrentDate: +date === +closestToCurrentDate
                }));
            } else {
                return [{items: notes}];
            }
        } else {
            let select = await executeSQL(
                `SELECT t.id, t.title, t.startTime, t.endTime, t.isNotificationEnabled, t.tag, 
                        t.repeatType, t.contentItems, t.isFinished, t.forkFrom, t.date, t.manualOrderIndex, t.mode
                        FROM Notes t
                        WHERE
                            t.id IN (${filteredNotesIDs.join(',')})
                            AND t.mode == 2
                            AND t.lastAction != ?`
            , [NoteAction.Delete]);

            let notes = [];
            for(let i = 0; i < select.rows.length; i++) {
                let item = select.rows.item(i);

                let nextItem = {
                    ...item,
                    contentItems: JSON.parse(item.contentItems),
                    startTime: ~item.startTime ? moment(item.startTime - getUTCOffset()) : false,
                    endTime: ~item.endTime ? moment(item.endTime - getUTCOffset()) : false,
                    date: moment(item.date - getUTCOffset()),
                    isFinished: Boolean(item.isFinished),
                    isNotificationEnabled: Boolean(item.isNotificationEnabled),
                    isShadow: Boolean(item.date === -1),
                    repeatDates: item.repeatDates ? item.repeatDates.split(",").map(a => item.repeatType === NoteRepeatType.Any ? +a - getUTCOffset() : +a) : [],
                };

                notes.push(nextItem);
            }
            return [{items: notes}];
        }
    }

    parseNoteWithTime(note, utcOffset) {
        return {
            ...note,
            contentItems: JSON.parse(note.contentItems),
            startTime: ~note.startTime ? moment(note.startTime - utcOffset) : false,
            endTime: ~note.endTime ? moment(note.endTime - utcOffset) : false,
            date: ~note.date ? moment(note.date - utcOffset) : -1,
            isFinished: Boolean(note.isFinished),
            isNotificationEnabled: Boolean(note.isNotificationEnabled),
            isShadow: Boolean(note.date === -1),
            repeatDates: note.repeatDates ? note.repeatDates.split(",").map(a => note.repeatType === NoteRepeatType.Any ? +a - utcOffset : +a) : [],
            lastActionTime: moment(note.lastActionTime),
        };
    }

    parseNoteWithoutTime(note) {
        return {
            ...note,
            contentItems: JSON.parse(note.contentItems),
            isFinished: Boolean(note.isFinished),
            lastActionTime: moment(note.lastActionTime)
        }
    }

    async getNotesWithTime(dates) {
        let utcOffset = getUTCOffset();

        let selects = await Promise.all(
            dates.map((date) => {
                let msDateUTC = date.valueOf() + utcOffset;
                return executeSQL(
                    `SELECT n.id, n.title, n.startTime, n.endTime, n.isNotificationEnabled, n.tag, n.repeatType, 
                        n.contentItems, n.isFinished, n.forkFrom, n.manualOrderIndex, n.date, n.mode, n.lastAction, n.lastActionTime,
                    (select GROUP_CONCAT(rep.value, ',') from NotesRepeatValues rep where rep.noteId = n.id) as repeatDates
                    FROM Notes n
                    LEFT JOIN NotesRepeatValues rep ON n.id = rep.noteId
                    WHERE
                        n.lastAction != ?
                        AND (
                            n.date = ?
                            OR (
                                n.date = -1 AND NOT EXISTS (SELECT forkFrom FROM Notes WHERE forkFrom = n.id AND date = ?)
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
                let note = this.parseNoteWithTime(select.rows.item(i));
                note.date = dates[selectIndex];
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
            `SELECT id, title, tag, contentItems, manualOrderIndex, mode, isFinished, lastAction, lastActionTime
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
            lastAction: NoteAction.Add,
            lastActionTime: moment().valueOf(),
            forkFrom: -1,
            isShadow: note.repeatType !== NoteRepeatType.NoRepeat
        };

        let noteId = await this.insertNote(nextNote);
        nextNote.id = noteId;

        await this.addNoteRepeatValues(nextNote);

        nextNote.isNotificationEnabled && notificationService.set(nextNote);

        return nextNote;
    }

    async insertNote(note) {
        let utcOffset = getUTCOffset();

        let insert = await executeSQL(
            `INSERT INTO Notes
            (title, startTime, endTime, isNotificationEnabled, tag, lastAction, lastActionTime, repeatType, contentItems, isFinished, date, forkFrom, mode, utcOffset)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
                note.title,
                note.startTime ? note.startTime.valueOf() + utcOffset : -1,
                note.endTime ? note.endTime.valueOf() + utcOffset : -1,
                Number(note.isNotificationEnabled),
                note.tag,
                note.lastAction,
                note.lastActionTime,
                note.repeatType,
                JSON.stringify(note.contentItems),
                Number(note.isFinished),
                ~note.date.valueOf() ? note.date.valueOf() + utcOffset : -1,
                note.forkFrom,
                note.mode,
                utcOffset
            ]
        );

        return insert.insertId;
    }

    async addNoteRepeatValues(note) {
        await executeSQL(`DELETE FROM NotesRepeatValues WHERE noteId = ?`, [ note.id ]);

        if (note.repeatType === NoteRepeatType.NoRepeat || note.repeatDates.length === 0) {
            return
        }

        let params = note.repeatDates.reduce((acc) => `${acc}, (?, ?)`, "");
        params = params.slice(2);
        let values = note.repeatDates.reduce((acc, item) => {
            let value = item;
            if (note.repeatType === NoteRepeatType.Any) {
                value = item + getUTCOffset();
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

    async updateNoteDynamicFields(note, fieldObj) {
        let nextNote = {
            ...note,
            ...fieldObj,
            lastAction: NoteAction.Edit,
            lastActionTime: moment().valueOf(),
        };

        if (nextNote.isShadow) {
            nextNote.forkFrom = note.id;
            nextNote.isShadow = false;
            let noteId = await this.insertNote(nextNote);
            nextNote.id = noteId;
        } else {
            await executeSQL(
                `UPDATE Notes
                SET 
                    contentItems = ?,
                    isFinished = ?,
                    lastAction = ?,
                    lastActionTime = ?
                WHERE id = ?;`,
                [
                    JSON.stringify(nextNote.contentItems),
                    Number(nextNote.isFinished),
                    nextNote.lastAction,
                    nextNote.lastActionTime,
                    nextNote.id
                ]
            )
        }

        return nextNote;
    }

    async updateNote(note, prevNote) {
        let nextNote = {
            ...note,
            lastAction: NoteAction.Edit,
            lastActionTime: moment().valueOf(),
        };
        if (prevNote.repeatType !== NoteRepeatType.NoRepeat) {
            if (!nextNote.isShadow) {
                nextNote.id = nextNote.forkFrom;
            }
            await executeSQL(`DELETE FROM Notes WHERE forkFrom = ?`, [nextNote.id]);
        }
        nextNote.isShadow = nextNote.repeatType !== NoteRepeatType.NoRepeat;
        nextNote.forkFrom = -1;
        nextNote.isFinished = false;

        await executeSQL(
            `UPDATE Notes
            SET title = ?, date = ?, startTime = ?, endTime = ?, isNotificationEnabled = ?, tag = ?, lastAction = ?, lastActionTime = ?, repeatType = ?, contentItems = ?, isFinished = ?, utcOffset = ?
            WHERE id = ?;`,
            [
                nextNote.title,
                nextNote.isShadow ? -1 : nextNote.date.valueOf() + getUTCOffset(),
                nextNote.startTime ? nextNote.startTime.valueOf() + getUTCOffset() : -1,
                nextNote.endTime ? nextNote.endTime.valueOf() + getUTCOffset() : -1,
                Number(nextNote.isNotificationEnabled),
                nextNote.tag,
                nextNote.lastAction,
                nextNote.lastActionTime,
                nextNote.repeatType,
                JSON.stringify(nextNote.contentItems),
                Number(nextNote.isFinished),
                getUTCOffset(),
                nextNote.id,
            ]
        );

        await this.addNoteRepeatValues(nextNote);

        notificationService.clear({...prevNote, id: nextNote.id});
        nextNote.isNotificationEnabled && notificationService.set(nextNote);

        return nextNote;
    }

    async deleteNote(note) {
        let nextNote = {
            ...note,
            lastAction: NoteAction.Delete,
            lastActionTime: moment().valueOf(),
        };
        if (nextNote.repeatType !== NoteRepeatType.NoRepeat && !nextNote.isShadow) {
            nextNote.isShadow = true;
            nextNote.id = nextNote.forkFrom;
            nextNote.forkFrom = -1;
        }

        await executeSQL(
            `UPDATE Notes
            SET 
                lastAction = ?, 
                lastActionTime = ?
            WHERE id = ? OR forkFrom = ?;`,
            [
                nextNote.lastAction,
                nextNote.lastActionTime,
                nextNote.id,
                nextNote.id
            ]
        );
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
            forkFrom = -1
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
            isShadow: note.date === -1,
            lastAction: NoteAction.Edit,
            lastActionTime: moment().valueOf()
        };

        await executeSQL(
            `UPDATE Notes
            SET lastAction = ?, lastActionTime = ?
            WHERE id = ? OR forkFrom = ?;`,
            [
                nextNote.lastAction,
                nextNote.lastActionTime,
                nextNote.id,
                nextNote.id
            ]
        );
        nextNote.isNotificationEnabled && notificationService.set(nextNote);

        return nextNote;
    }

    async removeDeletedNotes(untilDate) {
        await executeSQL(`
            DELETE FROM NotesRepeatValues
            WHERE noteId IN (
                SELECT noteId FROM NotesRepeatValues
                LEFT JOIN Notes ON NotesRepeatValues.noteId = Notes.id
                WHERE lastAction = ? AND lastActionTime <= ?
            );
        `, [NoteAction.Delete, untilDate]);

        return executeSQL(`
            DELETE FROM Notes 
            WHERE lastAction = ? AND lastActionTime <= ?
        `, [NoteAction.Delete, untilDate]);
    }

    async updateNotesManualSortIndex(notes) {
        let nextNotes = notes.slice();
        let notesInserted = [];
        for (let note of nextNotes) {
            if (note.isShadow) {
                note.forkFrom = note.id;
                note.isShadow = false;
                let noteId = await this.insertNote(note);
                note.id = noteId;
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