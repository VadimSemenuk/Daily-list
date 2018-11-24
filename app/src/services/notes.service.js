import executeSQL from '../utils/executeSQL';
import moment from 'moment';
import uuid from "uuid/v1";
import notificationService from "./notification.service";

window.e = executeSQL;

class NotesService {
    async getDayNotes(date) {
        let currentDate = date.valueOf();
        let select = await executeSQL(
            `SELECT t.id as key, t.uuid, t.title, t.startTime, t.endTime, t.startTimeCheckSum, t.endTimeCheckSum, t.notificate, t.tag, t.isSynced, t.isLastActionSynced, t.repeatType, t.userId,
            t.dynamicFields, t.finished, t.forkFrom, t.priority,
            CASE t.added WHEN ? THEN 0 ELSE 1 END as isShadow,
            ? as added
            FROM Tasks t
            LEFT JOIN TasksRepeatValues rep ON t.id = rep.taskId
            WHERE
                t.lastAction != 'DELETE' AND
                (
                    t.added = ? OR
                    (t.added = -1 AND t.repeatType = "day") OR
                    (t.added = -1 AND t.repeatType = "week" AND rep.value = ?) OR
                    (t.added = -1 AND t.repeatType = "any" AND rep.value = ?)
                );`,
            [currentDate, currentDate, currentDate, date.isoWeekday(), currentDate]
        );

        let unique = {};
        for(let i = 0; i < select.rows.length; i++) {
            let item = select.rows.item(i);
            let key = item.forkFrom === -1 ? item.key : item.forkFrom;

            if (unique[key] && !unique[key].isShadow) {
                continue;
            }

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
            }

            unique[key] = nextItem;
        }
        let notes = Object.values(unique);

        return {
            date: date,
            items: notes
        }
    }

    async getNotesByDates (dates) {
        let tasks = dates.map((a) => this.getDayNotes(a));
        return await Promise.all(tasks);
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
            ...timeCheckSums
        }

        let addedNote = await this.insertNote(noteToLocalInsert);
        await this.setNoteRepeat(addedNote);

        notificationService.clear(addedNote.repeatType === "any" ? addedNote.repeatDates : [addedNote.key]);
        if (addedNote.notificate) {
            notificationService.set(addedNote.key, addedNote);
        };

        return addedNote;
    }

    async insertNote(note) {
        let isShadow = note.repeatType !== "no-repeat" && note.forkFrom === -1;

        let insert = await executeSQL(
            `INSERT INTO Tasks
            (uuid, title, startTime, endTime, startTimeCheckSum, endTimeCheckSum, notificate, tag, lastAction, lastActionTime, userId, 
                isSynced, isLastActionSynced, repeatType, dynamicFields, finished, added, forkFrom, priority)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
                note.priority
            ]
        ).catch((err) => console.warn(err));

        return {
            ...note,
            key: insert.insertId,
            isShadow
        }
    }

    async updateNoteDynamicFields(note, fieldObj, date) {
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
            let actionTime = moment().valueOf();
            nextNote.uuid = noteUUID;
            nextNote.actionTime = actionTime;
            nextNote.forkFrom = note.key;
            nextNote = await this.insertNote(nextNote);
        } else {
            let update = await executeSQL(
                `UPDATE Tasks
                SET 
                    dynamicFields = ?,
                    finished = ?,
                    isLastActionSynced = 0
                WHERE id = ?;`,
                [
                    JSON.stringify(nextNote.dynamicFields),
                    Number(nextNote.finished),
                    nextNote.key
                ]
            ).catch((err) => console.warn(err));
            if (!update) {
                return
            }
        }

        return nextNote;
    }

    async updateNote(note) {
        let actionTime = moment().valueOf();
        let timeCheckSums = this.calculateTimeCheckSum(note);
        let nextNote = {
            ...note,
            ...timeCheckSums,
            lastAction: "EDIT",
            lastActionTime: actionTime,
            isLastActionSynced: 0
        }
        if (nextNote.prevNote.repeatType !== "no-repeat") {
            if (!nextNote.isShadow) {
                nextNote.key = nextNote.forkFrom;
            }
            await executeSQL(`DELETE FROM Tasks WHERE forkFrom = ?`, [nextNote.key]);
        }
        if (nextNote.repeatType === "no-repeat") {
            nextNote.isShadow = false;
        } else {
            nextNote.isShadow = true;
        }
        nextNote.forkFrom = -1;
        nextNote.finished = false;

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
        ).catch((err) => console.log('Error: ', err));

        await this.setNoteRepeat(nextNote);

        notificationService.clear(nextNote.prevNote.repeatType === "any" ? nextNote.prevNote.repeatDates : [nextNote.key]);
        if (nextNote.notificate) {
            notificationService.set(nextNote.key, nextNote);
        };

        return nextNote;
    }

    async updateNoteDate(note) {
        await executeSQL(`
            UPDATE Tasks
            SET
                added = ?,
                isLastActionSynced = 0
            WHERE id = ?
        `, [
            note.added.valueOf(),
            note.key
        ]);

        notificationService.clear(note.repeatType === "any" ? note.repeatDates : [note.key]);
        if (note.notificate) {
            notificationService.set(note.key, note);
        };

        return note;
    }

    async deleteNote(note) {
        let actionTime = moment().valueOf();
        let nextNote = {...note}
        if (nextNote.repeatType !== "no-repeat" && !nextNote.isShadow) {
            nextNote.isShadow = true;
            nextNote.key = nextNote.forkFrom;
            nextNote.forkFrom = -1;
        }

        await executeSQL(
            `UPDATE Tasks
            SET lastAction = ?, lastActionTime = ?, isLastActionSynced = 0
            WHERE id = ? OR forkFrom = ?;`,
            [
                "DELETE",
                actionTime,
                nextNote.key,
                nextNote.key
            ]
        ).catch((err) => console.warn(err));
        notificationService.clear(nextNote.repeatType === "any" ? nextNote.repeatDates : [nextNote.key]);

        return nextNote;
    }

    async setNoteRepeat(note) {
        if (note.repeatType === "no-repeat") {
            return
        }

        await executeSQL(`DELETE FROM TasksRepeatValues WHERE taskId = ?`, [ note.key ]).catch((err) => console.warn(err));

        let repeatDates = note.repeatDates;
        if (note.repeatType === "week") {
            repeatDates = [moment(note.added).isoWeekday()];
        } else if (note.repeatType === "day") {
            repeatDates = [note.added];
        } else if (repeatDates.length && repeatDates.length === 0) {
            return
        }

        await executeSQL(
            `INSERT INTO TasksRepeatValues
            (taskId, value)
            VALUES
            ${
                repeatDates.reduce((accumulator, currentValue) => {
                    if (accumulator === false) {
                        return `(${note.key}, ${currentValue})`;
                    }
                    return `${accumulator}, (${note.key}, ${currentValue})`;
                }, false)
            };`,
        ).catch((err) => console.warn(err));
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

    setNoteBackupState(noteId, isSynced, isLastActionSynced) {
        let whereStatement = "";
        let params = [+isSynced, +isLastActionSynced];
        if (noteId) {
            whereStatement = " WHERE id = ?";
            params.push(noteId);
        } else {
            whereStatement = " WHERE isSynced != 1 AND isLastActionSynced != 1";
        }
        return executeSQL(`UPDATE Tasks SET isSynced = ?, isLastActionSynced = ?${whereStatement};`, params).catch(err => console.warn(err))
    }

    async getNoteForBackup(noteKey) {
        let dataSelectWhereStatement = "";
        let dataSelectParams = [];
        if (noteKey !== undefined) {
            dataSelectWhereStatement = " WHERE t.id = ?";
            dataSelectParams = [noteKey];
        } else {
            dataSelectWhereStatement = " WHERE t.isLastActionSynced != 1";
        }

        let select = await executeSQL(`
            SELECT t.id, t.uuid, t.title, t.startTime, t.endTime, t.startTimeCheckSum, t.endTimeCheckSum, t.notificate, t.tag, t.isSynced, t.isLastActionSynced,
                t.repeatType, t.userId, t.added, t.dynamicFields, t.finished, t.forkFrom, tr.repeatValues, t.priority
			FROM (
				SELECT t.id, GROUP_CONCAT(rep.value, ',') as repeatValues
            	FROM Tasks t
                LEFT JOIN TasksRepeatValues rep ON t.id = rep.taskId
                ${dataSelectWhereStatement}
				GROUP BY t.id
			) tr
			LEFT JOIN Tasks t ON t.id = tr.id;
        `, dataSelectParams).catch((err) => {
            console.warn(err);
            return null;
        });

        if (!select || !select.rows) {
            return null
        }

        let res = [];
        for (let i = 0; i < select.rows.length; i++ ){
            res.push(select.rows.item(i));
        }
        return res;
    }

    async restoreNotesBackup(notes) {
        if (!notes || notes.length === 0) {
            return
        }

        let valuesString = notes.reduce((accumulator) => {
            return `${accumulator}, (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        }, "");
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

        let insert = await executeSQL(
            `INSERT INTO Tasks
            (uuid, title, startTime, endTime, startTimeCheckSum, endTimeCheckSum, notificate, tag, lastAction, lastActionTime, userId, 
                isSynced, isLastActionSynced, repeatType, dynamicFields, finished, added, forkFrom, priority)
            VALUES
            ${valuesString};
        `, values).catch((err) => console.warn(err));



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
        })
        rdValuesString = rdValuesString.slice(2);

        if (rdValues.length === 0) {
            return
        }

        await executeSQL(`
            INSERT INTO TasksRepeatValues
            (taskId, value)
            VALUES
            ${rdValuesString};
        `, rdValues).catch((err) => console.warn(err));



        // notificationService.clear(addedNote.repeatType === "any" ? addedNote.repeatDates : [addedNote.key]);
        // if (addedNote.notificate) {
        //     notificationService.set(addedNote.key, addedNote);
        // };
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
}

let noteService = new NotesService();

export default noteService;