import executeSQL from '../utils/executeSQL';
import moment from 'moment';
import uuid from "uuid/v1";
import notificationService from "./notification.service";
import getUTCOffset from "../utils/getUTCOffset";

window.e = executeSQL;

class NotesService {
    async searchNotes(mode, search, repeatType) {
        search = search.toLowerCase().trim();

        if (!search) {
            return [];
        }

        let allNotesSelect = await executeSQL(`SELECT t.id, t.title, t.dynamicFields FROM Tasks t;`);
        let filteredNotesIDs = [];
        for(let i = 0; i < allNotesSelect.rows.length; i++) {
            let item = allNotesSelect.rows.item(i);

            if (item.title && item.title.toLowerCase().includes(search)) {
                filteredNotesIDs.push(item.id);
                continue;
            }

            if (item.dynamicFields && item.dynamicFields.toLowerCase().includes(search)) {
                let dynamicFields = JSON.parse(item.dynamicFields);
                if (dynamicFields.some((f) => f.value && f.value.toLowerCase().includes(search))) {
                    filteredNotesIDs.push(item.id);
                }
            }
        }

        if (mode === 1) {
            let msCurrentDate = moment().startOf("day").valueOf();

            let select = await executeSQL(
                `SELECT t.id as key, t.uuid, t.title, t.startTime, t.endTime, t.notificate, t.tag, 
                        t.isSynced, t.isLastActionSynced, t.repeatType, t.userId, t.dynamicFields, t.finished, t.forkFrom, t.priority, t.added, t.manualOrderIndex, t.repeatDate, t.mode,
                        (select GROUP_CONCAT(rep.value, ',') from TasksRepeatValues rep where rep.taskId = t.id) as repeatDates
                        FROM Tasks t
                        WHERE
                            t.id IN (${filteredNotesIDs.join(',')})
                            AND ${repeatType === 'no-repeat' ? `(t.repeatType == 'no-repeat' OR t.repeatType == 'any')` : `((t.repeatType == 'week' OR t.repeatType == 'day') AND t.forkFrom == -1)`}
                            AND t.mode == 1
                            AND t.lastAction != 'DELETE'
                            AND t.lastAction != 'CLEAR'
                        ORDER BY t.added`
            );

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
                    dynamicFields: JSON.parse(item.dynamicFields),
                    startTime: ~item.startTime ? moment(item.startTime - getUTCOffset()) : false,
                    endTime: ~item.endTime ? moment(item.endTime - getUTCOffset()) : false,
                    added: moment(item.added - getUTCOffset()),
                    msAdded: item.added - getUTCOffset(),
                    finished: Boolean(item.finished),
                    notificate: Boolean(item.notificate),
                    isShadow: Boolean(item.added === -1),
                    isSynced: Boolean(item.isSynced),
                    isLastActionSynced: Boolean(item.isLastActionSynced),
                    repeatDates: item.repeatDates ? item.repeatDates.split(",").map(a => item.repeatType === 'any' ? +a - getUTCOffset() : +a) : [],
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
                `SELECT t.id as key, t.uuid, t.title, t.startTime, t.endTime, t.notificate, t.tag, 
                        t.isSynced, t.isLastActionSynced, t.repeatType, t.userId, t.dynamicFields, t.finished, t.forkFrom, t.priority, t.added, t.manualOrderIndex, t.repeatDate, t.mode
                        FROM Tasks t
                        WHERE
                            t.id IN (${filteredNotesIDs.join(',')})
                            AND t.mode == 2
                            AND t.lastAction != 'DELETE'
                            AND t.lastAction != 'CLEAR';`
            );

            let notes = [];
            for(let i = 0; i < select.rows.length; i++) {
                let item = select.rows.item(i);

                let nextItem = {
                    ...item,
                    dynamicFields: JSON.parse(item.dynamicFields),
                    startTime: ~item.startTime ? moment(item.startTime - getUTCOffset()) : false,
                    endTime: ~item.endTime ? moment(item.endTime - getUTCOffset()) : false,
                    added: moment(item.added - getUTCOffset()),
                    finished: Boolean(item.finished),
                    notificate: Boolean(item.notificate),
                    isShadow: Boolean(item.added === -1),
                    isSynced: Boolean(item.isSynced),
                    isLastActionSynced: Boolean(item.isLastActionSynced),
                    repeatDates: item.repeatDates ? item.repeatDates.split(",").map(a => item.repeatType === 'any' ? +a - getUTCOffset() : +a) : [],
                };

                notes.push(nextItem);
            }
            return [{items: notes}];
        }
    }

    async getNotes(mode, dates) {
        let selects = null;

        if (mode === 1) {
            if (!Array.isArray(dates)) {
                dates = [dates];
            }

            selects = await Promise.all(
                dates.map((date) => {
                    let msDateUTC = date.valueOf() + getUTCOffset();
                    return executeSQL(
                        `SELECT t.id as key, t.uuid, t.title, t.startTime, t.endTime, t.notificate, t.tag, 
                        t.isSynced, t.isLastActionSynced, t.repeatType, t.userId, t.dynamicFields, t.finished, t.forkFrom, t.priority, t.added, t.manualOrderIndex, t.repeatDate, t.mode,
                        (select GROUP_CONCAT(rep.value, ',') from TasksRepeatValues rep where rep.taskId = t.id) as repeatDates
                        FROM Tasks t
                        LEFT JOIN TasksRepeatValues rep ON t.id = rep.taskId
                        WHERE
                            t.lastAction != 'DELETE'
                            AND t.lastAction != 'CLEAR'
                            AND (
                                t.added = ?
                                OR (
                                    t.added = -1 AND NOT EXISTS (SELECT forkFrom FROM Tasks WHERE forkFrom = t.id AND repeatDate = ?)
                                    AND (
                                        t.repeatType = "day"
                                        OR (t.repeatType = "week" AND rep.value = ?)
                                        OR (t.repeatType = "any" AND rep.value = ?)
                                    )
                                )
                            )
                            AND t.mode == 1;`,
                        [msDateUTC, msDateUTC, date.isoWeekday(), msDateUTC]
                    );
                })
            )
        } else {
            dates = [moment().startOf("day")];
            selects = await Promise.all(
                dates.map((date) => {
                    return executeSQL(
                        `SELECT t.id as key, t.uuid, t.title, t.startTime, t.endTime, t.notificate, t.tag, 
                        t.isSynced, t.isLastActionSynced, t.repeatType, t.userId, t.dynamicFields, t.finished, t.forkFrom, t.priority, t.added, t.manualOrderIndex, t.repeatDate, t.mode
                        FROM Tasks t
                        WHERE
                            t.mode == 2
                            AND t.lastAction != 'DELETE'
                            AND t.lastAction != 'CLEAR';`,
                        []
                    );
                })
            )
        }

        let dateNotes = selects.map((select, selectIndex) => {
            let notes = [];
            for(let i = 0; i < select.rows.length; i++) {
                let item = select.rows.item(i);

                let nextItem = {
                    ...item,
                    dynamicFields: JSON.parse(item.dynamicFields),
                    startTime: ~item.startTime ? moment(item.startTime - getUTCOffset()) : false,
                    endTime: ~item.endTime ? moment(item.endTime - getUTCOffset()) : false,
                    added: moment(dates[selectIndex]),
                    finished: Boolean(item.finished),
                    notificate: Boolean(item.notificate),
                    isShadow: Boolean(item.added === -1),
                    isSynced: Boolean(item.isSynced),
                    isLastActionSynced: Boolean(item.isLastActionSynced),
                    repeatDates: item.repeatDates ? item.repeatDates.split(",").map(a => item.repeatType === 'any' ? +a - getUTCOffset() : +a) : [],
                };

                notes.push(nextItem);
            }

            return {
                date: dates[selectIndex],
                items: notes
            }
        });

        if (mode === 1 && dateNotes.length === 1) {
            return dateNotes[0];
        }

        return dateNotes;
    }

    async getNotesByDates(dates) {
        let tasks = dates.map((a) => this.getNotes(a));
        return Promise.all(tasks);
    }

    async addNote(note) {
        let noteToLocalInsert = {
            ...note,
            lastAction: "ADD",
            userId: 1,
            isLastActionSynced: 0,
            isSynced: 0,
            uuid: uuid(),
            lastActionTime: moment().valueOf(),
            forkFrom: -1,
            repeatDate: -1
        };

        noteToLocalInsert.priority = noteToLocalInsert.priority || 2;

        let addedNote = await this.insertNote(noteToLocalInsert);
        await this.setNoteRepeat(addedNote);

        addedNote.notificate && notificationService.set(addedNote);

        return addedNote;
    }

    async insertNote(note) {
        let isShadow = note.repeatType !== "no-repeat" && note.forkFrom === -1;

        let insert = await executeSQL(
            `INSERT INTO Tasks
            (uuid, title, startTime, endTime, notificate, tag, lastAction, lastActionTime, userId, 
                isSynced, isLastActionSynced, repeatType, dynamicFields, finished, added, forkFrom, priority, repeatDate, mode, utcOffset)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
                note.uuid,
                note.title,
                note.startTime ? note.startTime.valueOf() + getUTCOffset() : -1,
                note.endTime ? note.endTime.valueOf() + getUTCOffset() : -1,
                Number(note.notificate),
                note.tag,
                note.lastAction,
                note.lastActionTime,
                note.userId,
                note.isSynced,
                note.isLastActionSynced,
                note.repeatType,
                JSON.stringify(note.dynamicFields),
                Number(note.finished),
                isShadow ? -1 : note.added.valueOf() + getUTCOffset(),
                note.forkFrom,
                note.priority,
                note.repeatDate,
                note.mode,
                getUTCOffset()
            ]
        );

        return {
            ...note,
            key: insert.insertId,
            isShadow
        }
    }

    async updateNoteDynamicFields(note, fieldObj) {
        let nextNote = {
            ...note,
            ...fieldObj,
            isLastActionSynced: 0,
            lastAction: "EDIT",
            lastActionTime: moment().valueOf(),
        };

        if (nextNote.isShadow) {
            nextNote.uuid = uuid();
            nextNote.forkFrom = note.key;
            nextNote.repeatDate = note.repeatDate === -1 ? note.added.valueOf() + getUTCOffset() : note.repeatDate;
            nextNote = await this.insertNote(nextNote);
        } else {
            await executeSQL(
                `UPDATE Tasks
                SET 
                    dynamicFields = ?,
                    finished = ?,
                    isLastActionSynced = ?,
                    lastAction = ?,
                    lastActionTime = ?
                WHERE id = ?;`,
                [
                    JSON.stringify(nextNote.dynamicFields),
                    Number(nextNote.finished),
                    nextNote.isLastActionSynced,
                    nextNote.lastAction,
                    nextNote.lastActionTime,
                    nextNote.key
                ]
            )
        }

        return nextNote;
    }

    async updateNote(note, prevNote) {
        let nextNote = {
            ...note,
            lastAction: "EDIT",
            lastActionTime: moment().valueOf(),
            isLastActionSynced: 0
        };
        if (prevNote.repeatType !== "no-repeat") {
            if (!nextNote.isShadow) {
                nextNote.key = nextNote.forkFrom;
            }
            await executeSQL(`DELETE FROM Tasks WHERE forkFrom = ?`, [nextNote.key]);
        }
        nextNote.isShadow = nextNote.repeatType !== "no-repeat";
        nextNote.forkFrom = -1;
        nextNote.finished = false;
        nextNote.repeatDate = -1;

        nextNote.priority = nextNote.priority || 2;

        await executeSQL(
            `UPDATE Tasks
            SET title = ?, added = ?, startTime = ?, endTime = ?, notificate = ?, tag = ?, 
                isLastActionSynced = 0, lastAction = ?, lastActionTime = ?, repeatType = ?, dynamicFields = ?, finished = 0, priority = ?, utcOffset = ?
            WHERE id = ?;`,
            [
                nextNote.title,
                nextNote.isShadow ? -1 : nextNote.added.valueOf() + getUTCOffset(),
                nextNote.startTime ? nextNote.startTime.valueOf() + getUTCOffset() : -1,
                nextNote.endTime ? nextNote.endTime.valueOf() + getUTCOffset() : -1,
                Number(nextNote.notificate),
                nextNote.tag,
                nextNote.lastAction,
                nextNote.lastActionTime,
                nextNote.repeatType,
                JSON.stringify(nextNote.dynamicFields),
                nextNote.priority,
                getUTCOffset(),
                nextNote.key,
            ]
        );

        await this.setNoteRepeat(nextNote);

        notificationService.clear({...prevNote, key: nextNote.key});
        nextNote.notificate && notificationService.set(nextNote);

        return nextNote;
    }

    async updateNoteDate(note, nextDate) {
        let nextNote = {
            ...note,
            added: nextDate,
            lastAction: "EDIT",
            lastActionTime: moment().valueOf(),
            isLastActionSynced: 0
        };

        await executeSQL(`
            UPDATE Tasks
            SET
                added = ?,
                isLastActionSynced = ?,
                lastAction = ?,
                lastActionTime = ?,
                utcOffset = ?
            WHERE id = ?
        `, [
            nextDate.valueOf() + getUTCOffset(),
            nextNote.isLastActionSynced,
            nextNote.lastAction,
            nextNote.lastActionTime,
            getUTCOffset(),
            note.key,
        ]);

        notificationService.clear(note);
        note.notificate && notificationService.set(note);

        return nextNote;
    }

    async deleteNote(note) {
        let actionTime = moment().valueOf();
        let nextNote = {...note};
        if (nextNote.repeatType !== "no-repeat" && !nextNote.isShadow) {
            nextNote.isShadow = true;
            nextNote.key = nextNote.forkFrom;
            nextNote.forkFrom = -1;
        }

        await executeSQL(
            `UPDATE Tasks
            SET 
                lastAction = ?, 
                lastActionTime = ?, 
                isLastActionSynced = 0
            WHERE id = ? OR forkFrom = ?;`,
            [
                "DELETE",
                actionTime,
                nextNote.key,
                nextNote.key
            ]
        );
        notificationService.clear(nextNote);

        return nextNote;
    }

    async setNoteRepeat(note) {
        await executeSQL(`DELETE FROM TasksRepeatValues WHERE taskId = ?`, [ note.key ]);

        if (note.repeatType === "no-repeat" || note.repeatDates.length === 0) {
            return
        }

        let params = note.repeatDates.reduce((acc) => `${acc}, (?, ?)`, "");
        params = params.slice(2);
        let values = note.repeatDates.reduce((acc, item) => {
            let value = item;
            if (note.repeatType === 'any') {
                value = item + getUTCOffset();
            }
            return [...acc, note.key, value]
        }, []);

        await executeSQL(`
            INSERT INTO TasksRepeatValues
            (taskId, value)
            VALUES
            ${params};
        `, values);
    }

    async getDeletedNotes() {
        let select = await executeSQL(
            `SELECT t.id as key, t.uuid, t.title, t.startTime, t.endTime, t.notificate, t.tag, t.isSynced, t.isLastActionSynced, t.repeatType, t.userId,
            t.dynamicFields, t.finished, t.forkFrom, t.priority, t.lastActionTime
            FROM Tasks t
            WHERE t.lastAction = 'DELETE' AND
            t.forkFrom = -1
            ORDER BY t.lastActionTime
            LIMIT 100;`
        );

        let notes = [];
        for(let i = 0; i < select.rows.length; i++) {
            let item = select.rows.item(i);

            let nextItem = {
                ...item,
                dynamicFields: JSON.parse(item.dynamicFields),
                startTime: ~item.startTime ? moment(item.startTime) : false,
                endTime: ~item.endTime ? moment(item.endTime) : false,
                added: moment(item.added),
                finished: Boolean(item.finished),
                notificate: Boolean(item.notificate),
                isShadow: Boolean(item.isShadow),
                isSynced: Boolean(item.isSynced),
                isLastActionSynced: Boolean(item.isLastActionSynced),
                lastActionTime: moment(item.lastActionTime)
            };

            notes.push(nextItem);
        }

        return notes;
    }

    async restoreNote(note) {
        let nextNote = {
            ...note,
            isShadow: note.added === -1,
            lastAction: "UPDATE",
            lastActionTime: moment().valueOf()
        };

        await executeSQL(
            `UPDATE Tasks
            SET lastAction = ?, lastActionTime = ?, isLastActionSynced = 0
            WHERE id = ? OR forkFrom = ?;`,
            [
                nextNote.lastAction,
                nextNote.lastActionTime,
                nextNote.key,
                nextNote.key
            ]
        );
        nextNote.notificate && notificationService.set(nextNote);

        return nextNote;
    }

    async cleanDeletedNotes() {
        await executeSQL(`                               
            UPDATE Tasks
            SET lastAction = ?, lastActionTime = ?, isLastActionSynced = ?
            WHERE lastAction = 'DELETE';
        `, ['CLEAR', moment().valueOf(), 0]);

        return this.removeClearedNotes();
    }

    async cleanOldDeletedNotes() {
        await executeSQL(`                               
            UPDATE Tasks
            SET lastAction = ?, lastActionTime = ?, isLastActionSynced = ?
            WHERE lastAction = 'DELETE' AND lastActionTime <= ?;
        `, ['CLEAR', moment().valueOf(), 0, moment().subtract(30, "day").valueOf()]);

        return this.removeClearedNotes();
    }

    async removeClearedNotes(msBackupStartTime) {
        let params = [];
        let whereStatement = "";
        if (msBackupStartTime !== undefined) {
            whereStatement += "lastActionTime <= ?";
            params.push(msBackupStartTime);
        }

        await executeSQL(`
            DELETE FROM TasksRepeatValues
            WHERE taskId IN (
                SELECT taskId FROM TasksRepeatValues
                LEFT JOIN Tasks ON TasksRepeatValues.taskId = Tasks.id
                WHERE Tasks.lastAction = 'CLEAR' ${whereStatement ? "AND " + whereStatement : ""}
            );
        `, params);

        return executeSQL(`
            DELETE FROM Tasks
            WHERE lastAction = 'CLEAR' ${whereStatement ? "AND " + whereStatement : ""}
        `, params);
    }

    async updateNotesManualSortIndex(notes) {
        let nextNotes = notes.slice();
        let notesInserted = [];
        for (let note of nextNotes) {
            if (note.isShadow) {
                note.uuid = uuid();
                note.forkFrom = note.key;
                note.repeatDate = note.repeatDate === -1 ? note.added.valueOf() + getUTCOffset() : note.repeatDate;
                note = await this.insertNote(note);
                notesInserted.push(note);
            }
        }

        const values = notes.reduce((acc, val) => [...acc, val.key, val.manualOrderIndex], []);
        const valuesPlaces = notes.reduce((acc) => [...acc, '(?, ?)'], []).join(", ");

        let sql = `
            WITH Tmp (id, manualOrderIndex) AS (VALUES ${valuesPlaces})
            UPDATE Tasks SET manualOrderIndex = (SELECT manualOrderIndex FROM Tmp WHERE Tasks.id = Tmp.id) WHERE id IN (SELECT id FROM Tmp);
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
        { val: "no-repeat", translateId: "repeat-type-no-repeat" },
        { val: "day", translateId: "repeat-type-day" },
        { val: "week", translateId: "repeat-type-week" },
        { val: "any", translateId: "repeat-type-any" }
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

    priorityOptions = [
        { val: 4, translateId: "priority-very-high" },
        { val: 3, translateId: "priority-high" },
        { val: 2, translateId: "priority-medium" },
        { val: 1, translateId: "priority-low" },
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

    getPriorityOptions() {
        return [...this.priorityOptions]
    }

    getWeekRepeatOptions() {
        return [...this.weekRepeatOptions]
    }
}

let noteService = new NotesService();

export default noteService;