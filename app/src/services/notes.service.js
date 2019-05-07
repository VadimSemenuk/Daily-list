import executeSQL from '../utils/executeSQL';
import moment from 'moment';
import uuid from "uuid/v1";
import notificationService from "./notification.service";

window.e = executeSQL;

class NotesService {
    async getDayNotes(date) {
        let currentDate = date.valueOf();
        let select = await executeSQL(
            `SELECT t.id as key, t.uuid, t.title, t.startTime, t.endTime, t.startTimeCheckSum, t.endTimeCheckSum, t.notificate, t.tag, 
            t.isSynced, t.isLastActionSynced, t.repeatType, t.userId, t.dynamicFields, t.finished, t.forkFrom, t.priority, t.added, t.repeatDate,
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
                );`,
            [currentDate, currentDate, date.isoWeekday(), currentDate]
        );

        let notes = [];
        for(let i = 0; i < select.rows.length; i++) {
            let item = select.rows.item(i);

            let nextItem = {
                ...item,
                dynamicFields: JSON.parse(item.dynamicFields),
                startTime: ~item.startTime ? moment(item.startTime) : false,
                endTime: ~item.endTime ? moment(item.endTime) : false,
                added: moment(currentDate),
                finished: Boolean(item.finished),
                notificate: Boolean(item.notificate),
                isShadow: Boolean(item.added === -1),
                isSynced: Boolean(item.isSynced),
                isLastActionSynced: Boolean(item.isLastActionSynced),
                repeatDates: item.repeatDates ? item.repeatDates.split(",").map(a => +a) : [],
            };

            notes.push(nextItem);
        }

        return {
            date: date,
            items: notes
        }
    }

    async getNotesByDates(dates) {
        let tasks = dates.map((a) => this.getDayNotes(a));
        return Promise.all(tasks);
    }

    async addNote(note) {
        let noteUUID = uuid();
        let actionTime = moment().valueOf();
        let timeCheckSums = this.calculateTimeCheckSum(note);
        let noteToLocalInsert = {
            ...note,
            lastAction: "ADD",
            userId: 1,
            isLastActionSynced: 0,
            isSynced: 0,
            uuid: noteUUID,
            lastActionTime: actionTime,
            forkFrom: -1,
            repeatDate: -1,
            ...timeCheckSums
        };

        let addedNote = await this.insertNote(noteToLocalInsert);
        await this.setNoteRepeat(addedNote);

        notificationService.clear(addedNote);
        addedNote.notificate && notificationService.set(addedNote);

        return addedNote;
    }

    async insertNote(note) {
        let isShadow = note.repeatType !== "no-repeat" && note.forkFrom === -1;

        let insert = await executeSQL(
            `INSERT INTO Tasks
            (uuid, title, startTime, endTime, startTimeCheckSum, endTimeCheckSum, notificate, tag, lastAction, lastActionTime, userId, 
                isSynced, isLastActionSynced, repeatType, dynamicFields, finished, added, forkFrom, priority, repeatDate)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
                note.uuid,
                note.title,
                note.startTime ? note.startTime.valueOf() : -1,
                note.endTime ? note.endTime.valueOf() : -1,
                note.startTimeCheckSum,
                note.endTimeCheckSum,
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
                isShadow ? -1 : note.added.valueOf(),
                note.forkFrom,
                note.priority,
                note.repeatDate
            ]
        );

        return {
            ...note,
            key: insert.insertId,
            isShadow
        }
    }

    async updateNoteDynamicFields(note, fieldObj) {
        let actionTime = moment().valueOf();
        let nextNote = {
            ...note,
            ...fieldObj,
            isLastActionSynced: 0,
            lastAction: "EDIT",
            lastActionTime: actionTime,
        };

        if (nextNote.isShadow) {
            let noteUUID = uuid();
            nextNote.uuid = noteUUID;
            nextNote.forkFrom = note.key;
            nextNote.repeatDate = note.repeatDate === -1 ? note.added.valueOf() : note.repeatDate;
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
        let actionTime = moment().valueOf();
        let timeCheckSums = this.calculateTimeCheckSum(note);
        let nextNote = {
            ...note,
            ...timeCheckSums,
            lastAction: "EDIT",
            lastActionTime: actionTime,
            isLastActionSynced: 0
        };
        if (prevNote.repeatType !== "no-repeat") {
            if (!nextNote.isShadow) {
                nextNote.key = nextNote.forkFrom;
                let select = await executeSQL(`SELECT uuid FROM Tasks WHERE id = ?`, [nextNote.key]);
                if (select.rows.length) {
                    nextNote.key = select.rows.item(0).uuid;
                }
            }
            await executeSQL(`DELETE FROM Tasks WHERE forkFrom = ?`, [nextNote.key]);
        }
        nextNote.isShadow = nextNote.repeatType !== "no-repeat";
        nextNote.forkFrom = -1;
        nextNote.finished = false;
        nextNote.repeatDate = -1;

        await executeSQL(
            `UPDATE Tasks
            SET title = ?, added = ?, startTime = ?, endTime = ?, startTimeCheckSum = ?, endTimeCheckSum = ?, notificate = ?, tag = ?, 
                isLastActionSynced = 0, lastAction = ?, lastActionTime = ?, repeatType = ?, dynamicFields = ?, finished = 0, priority = ?
            WHERE id = ?;`,
            [
                nextNote.title,
                nextNote.isShadow ? -1 : nextNote.added.valueOf(),
                nextNote.startTime ? nextNote.startTime.valueOf() : -1,
                nextNote.endTime ? nextNote.endTime.valueOf() : -1,
                nextNote.startTimeCheckSum,
                nextNote.endTimeCheckSum,
                Number(nextNote.notificate),
                nextNote.tag,
                nextNote.lastAction,
                nextNote.lastActionTime,
                nextNote.repeatType,
                JSON.stringify(nextNote.dynamicFields),
                nextNote.priority,
                nextNote.key
            ]
        );

        await this.setNoteRepeat(nextNote);

        notificationService.clear(nextNote);
        nextNote.notificate && notificationService.set(nextNote);

        return nextNote;
    }

    async updateNoteDate(note, nextDate) {
        let actionTime = moment().valueOf();
        let nextNote = {
            ...note,
            added: nextDate,
            lastAction: "EDIT",
            lastActionTime: actionTime,
            isLastActionSynced: 0
        };

        await executeSQL(`
            UPDATE Tasks
            SET
                added = ?,
                isLastActionSynced = ?,
                lastAction = ?,
                lastActionTime = ?
            WHERE id = ?
        `, [
            note.added.valueOf(),
            nextNote.isLastActionSynced,
            nextNote.lastAction,
            nextNote.lastActionTime,
            note.key
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

        let params = note.repeatDates.reduce((acc, value) => `${acc}, (?, ?)`, "");
        params = params.slice(2);
        let values = note.repeatDates.reduce((acc, value) => [...acc, note.key, value], []);

        await executeSQL(`
            INSERT INTO TasksRepeatValues
            (taskId, value)
            VALUES
            ${params};
        `, values);
    }

    async getNoteRepeatDates(note) {
        let key = note.forkFrom === -1 ? note.key : note.forkFrom;

        let select = await executeSQL(`SELECT value from TasksRepeatValues WHERE taskId = ?`, [key]);

        let values = [];
        if (select.rows) {
            for(let i = 0; i < select.rows.length; i++) {
                values.push(select.rows.item(i).value);
            }
        }

        return values;
    }

    setNoteBackupState(noteId, isSynced, isLastActionSynced, msBackupStartTime) {
        let whereStatement = "";
        let params = [+isSynced, +isLastActionSynced];
        if (noteId) {
            whereStatement = " WHERE id = ?";
            params.push(noteId);
        } else {
            whereStatement = " WHERE isLastActionSynced = 0";
        }
        if (msBackupStartTime !== undefined) {
            whereStatement += " AND lastActionTime <= ?";
            params.push(msBackupStartTime);
        }
        return executeSQL(`UPDATE Tasks SET isSynced = ?, isLastActionSynced = ?${whereStatement};`, params);
    }

    // TODO: check fields
    async getNoteForBackup(noteKey) {
        let dataSelectWhereStatement = "";
        let dataSelectParams = [];
        if (noteKey !== undefined) {
            dataSelectWhereStatement = " WHERE t.id = ?";
            dataSelectParams = [noteKey];
        } else {
            dataSelectWhereStatement = " WHERE t.isLastActionSynced = 0";
        }

        let select = await executeSQL(`
            SELECT t.id, t.uuid, t.title, t.startTime, t.endTime, t.startTimeCheckSum, t.endTimeCheckSum, t.notificate, t.tag, 
                t.isSynced, t.isLastActionSynced, t.lastAction, t.lastActionTime, t.repeatType, t.userId, t.added, t.dynamicFields, t.finished, t.forkFrom, t.priority, 
                (select GROUP_CONCAT(tt.uuid, ',') from Tasks tt where tt.forkFrom = t.id) as forked,
                (select GROUP_CONCAT(rep.value, ',') from TasksRepeatValues rep where rep.taskId = t.id) as repeatValues
            FROM Tasks t
            ${dataSelectWhereStatement};
        `, dataSelectParams);

        let res = [];
        for (let i = 0; i < select.rows.length; i++ ) {
            res.push(select.rows.item(i));
        }
        return res;
    }

    async restoreNotesBackup(notes) {
        if (!notes || notes.length === 0) {
            return
        }

        await executeSQL(`DELETE FROM Tasks;`);
        await executeSQL(`DELETE FROM TasksRepeatValues;`);

        let valuesString = notes.reduce((accumulator) => `${accumulator}, (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, "");
        valuesString = valuesString.slice(2);

        let values = notes.reduce((accumulator, note) => {
            note = note.note;
            return [
                ...accumulator, 
                note.uuid,
                note.title,
                note.startTime,
                note.endTime,
                note.startTimeCheckSum,
                note.endTimeCheckSum,
                note.notificate,
                note.tag,
                note.lastAction,
                note.lastActionTime,
                note.userId,
                1,
                1,
                note.repeatType,
                note.dynamicFields,
                note.finished,
                note.added,
                note.forkFrom,
                note.priority
            ]
        }, []);

        await executeSQL(
            `INSERT INTO Tasks
            (uuid, title, startTime, endTime, startTimeCheckSum, endTimeCheckSum, notificate, tag, lastAction, lastActionTime, userId, 
                isSynced, isLastActionSynced, repeatType, dynamicFields, finished, added, forkFrom, priority)
            VALUES
            ${valuesString};
        `, values);


        let rdValuesString = "";
        let rdValues = [];
        notes.forEach((note) => {
            note = note.note;
            if (!note.repeatValues) {
                return
            }

            let repeatValues = note.repeatValues.split(",");
            repeatValues.forEach((rdValue) => {
                rdValues.push(note.id);
                rdValues.push(+rdValue);
                rdValuesString +=  ", (?, ?)"
            });
        });
        rdValuesString = rdValuesString.slice(2);

        if (rdValues.length === 0) {
            return
        }

        await executeSQL(`
            INSERT INTO TasksRepeatValues
            (taskId, value)
            VALUES
            ${rdValuesString};
        `, rdValues);

        notes.forEach((note) => {
            // TODO: need a note id
            notificationService.clearAll();
            note.notificate && notificationService.set(note);
        });
    }

    async getDeletedNotes() {
        let select = await executeSQL(
            `SELECT t.id as key, t.uuid, t.title, t.startTime, t.endTime, t.startTimeCheckSum, t.endTimeCheckSum, t.notificate, t.tag, t.isSynced, t.isLastActionSynced, t.repeatType, t.userId,
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
        let actionTime = moment().valueOf();
        let nextNote = {
            ...note,
            isShadow: note.added === -1
        }

        await executeSQL(
            `UPDATE Tasks
            SET lastAction = ?, lastActionTime = ?, isLastActionSynced = 0
            WHERE id = ? OR forkFrom = ?;`,
            [
                "UPDATE",
                actionTime,
                nextNote.key,
                nextNote.key
            ]
        );
        nextNote.notificate && notificationService.set(nextNote);

        return nextNote;
    }

    async cleanDeletedNotes() {
        return executeSQL(`
            UPDATE Tasks
            SET lastAction = ?, lastActionTime = ?, isLastActionSynced = ?
            WHERE lastAction = 'DELETE';
        `, ['CLEAR', moment().valueOf(), 0]);
    }

    async removeClearedNotes(msBackupStartTime) {
        let params = [];
        let whereStatement = "";
        if (msBackupStartTime !== undefined) {
            whereStatement += "lastActionTime <= ?";
            params.push(msBackupStartTime);
        }

        // TODO: add cascade delete
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

    calculateTimeCheckSum (note) {
        let startTimeCheckSum = note.startTime ? note.startTime.valueOf() - note.added : 0;
        let endTimeCheckSum = note.endTime ? note.endTime.valueOf() - note.added : 0;

        return {
            startTimeCheckSum,
            endTimeCheckSum
        }
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