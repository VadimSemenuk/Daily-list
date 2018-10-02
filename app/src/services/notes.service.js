import executeSQL from '../utils/executeSQL';
import moment from 'moment';
import uuid from "uuid/v1";
import synchronizationService from "./synchronization.service";
import authService from "./auth.service";
import notificationService from "./notification.service";

window.moment = moment;

let tags = [
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

let repeatOptions = [
    {
        val: "no-repeat",
        translateId: "repeat-type-no-repeat"
    },
    {
        val: "day",
        translateId: "repeat-type-day"
    },
    {
        val: "week",
        translateId: "repeat-type-week"
    },
    {
        val: "any",
        translateId: "repeat-type-any"
    }
];

class NotesService {
    async getWeekNotes(date) {
        let finDate = moment(date).startOf("isoWeek").valueOf() + 604800000;

        let select = await executeSQL(
            `SELECT id as key, uuid, title, startTime, endTime, notificate, tag, dynamicFields, added, finished, isSynced
            FROM Tasks
            WHERE added >= ? AND added <= ? AND userId = ? AND lastAction != 'DELETE';`,
            [date.startOf("isoWeek").valueOf(), finDate, authService.getUserId()]
        );

        let notes = [];
        if (select.rows) {
            for(let i = 0; i < select.rows.length; i++) {
                let item = select.rows.item(i);
                item.dynamicFields = JSON.parse(item.dynamicFields);
                ~item.startTime ? item.startTime = moment(item.startTime) : item.startTime = false;
                ~item.endTime ? item.endTime = moment(item.endTime) : item.endTime = false;
                ~item.added ? item.added = moment(item.added) : item.added = false;
                item.finished = Boolean(item.finished);
                item.notificate = Boolean(item.notificate);

                notes.push(item);
            }
        }

        let weekDates = [];
        for (let i = 1; i < 8; i++) {
            weekDates.push(moment(date).day(i));
        }

        let res = weekDates.map((a) => {
            let msDate = a.valueOf();

            return {
                date: a,
                items: notes.filter((a) => a.added.valueOf() === msDate)
            }
        });

        return res;
    }

    async getDayNotes(date) {
        let currentDate = date.valueOf();
        let select = await executeSQL(
            `SELECT t.id as key, t.uuid, t.title, t.startTime, t.endTime, t.startTimeCheckSum, t.endTimeCheckSum, t.notificate, t.tag, t.isSynced, t.repeatType, t.userId,
            t.dynamicFields, t.finished, t.forkFrom,
            CASE t.added WHEN ? THEN 0 ELSE 1 END as isShadow,
            ? as added
            FROM Tasks t
            LEFT JOIN TasksRepeatValues rep ON t.id = rep.taskId
            WHERE
                t.userId = ? AND
                t.lastAction != 'DELETE' AND
                (
                    t.added = ? OR
                    (t.added = -1 AND t.repeatType = "day") OR
                    (t.added = -1 AND t.repeatType = "week" AND rep.value = ?) OR
                    (t.added = -1 AND t.repeatType = "any" AND rep.value = ?)
                );`,
            [currentDate, currentDate, authService.getUserId(), currentDate, date.isoWeekday(), currentDate]
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
                isShadow: Boolean(item.isShadow)
            }

            unique[key] = nextItem;
        }
        let notes = Object.values(unique);

        // let notes = [];
        // for(let i = 0; i < select.rows.length; i++) {
        //     let item = select.rows.item(i);

        //     let nextItem = {
        //         ...item,
        //         dynamicFields: JSON.parse(item.dynamicFields),
        //         startTime: ~item.startTime ? moment(item.startTime) : false,
        //         endTime: ~item.endTime ? moment(item.endTime) : false,
        //         added: moment(item.added),
        //         finished: Boolean(item.finished),
        //         notificate: Boolean(item.notificate),
        //         isShadow: Boolean(item.isShadow)
        //     }

        //     notes.push(nextItem);
        // }

        return {
            date: date,
            items: notes
        }
    }

    async getNotesByDates (dates, period) {
        let fn = period === 0 ? this.getWeekNotes : this.getDayNotes;
        let tasks = dates.map((a) => fn(a));
        return await Promise.all(tasks);
    }

    async addNote(note) {
        let noteUUID = uuid();
        let actionTime = moment().valueOf();
        let timeCheckSums = this.calculateTimeCheckSum(note);
        let noteToLocalInsert = {
            ...note,
            lastAction: "ADD",
            userId: authService.getUserId(),
            isLastActionSynced: 0,
            isSynced: 0,
            uuid: noteUUID,
            lastActionTime: actionTime,
            forkFrom: -1,
            ...timeCheckSums
        }

        let addedNote = await this.insertNote(noteToLocalInsert);
        await this.setNoteRepeat(addedNote);

        notificationService.clear(note.repeatType === "any" ? note.repeatDates : [note.key]);
        if (note.notificate) {
            notificationService.set(note.key, note);
        };

        synchronizationService.syncNote("ADD", note);

        return addedNote;
    }

    async insertNote(note) {
        let isShadow = note.repeatType !== "no-repeat" && note.forkFrom === -1;

        let insert = await executeSQL(
            `INSERT INTO Tasks
            (uuid, title, startTime, endTime, startTimeCheckSum, endTimeCheckSum, notificate, tag, lastAction, lastActionTime, userId, isSynced, isLastActionSynced, repeatType,
                dynamicFields, finished, added, forkFrom)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
                note.forkFrom
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
                    finished = ?
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

        synchronizationService.syncNote("UPDATE_DYNAMIC_FIELDS", nextNote);

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
            let key = nextNote.isShadow ? nextNote.key : nextNote.forkFrom;
            await executeSQL(`DELETE FROM Tasks WHERE forkFrom = ?`, [key]);
            nextNote.isShadow = true;
        }

        await executeSQL(
            `UPDATE Tasks
            SET title = ?, added = ?, startTime = ?, endTime = ?, startTimeCheckSum = ?, endTimeCheckSum = ?, notificate = ?, tag = ?, 
                isLastActionSynced = 0, lastAction = ?, lastActionTime = ?, repeatType = ?, dynamicFields = ?, finished = 0
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
                nextNote.forkFrom === -1 ? nextNote.key : nextNote.forkFrom
            ]
        ).catch((err) => console.log('Error: ', err));

        nextNote.finished = false;

        await this.setNoteRepeat(nextNote);

        notificationService.clear(nextNote.repeatType === "any" ? nextNote.prevNote.repeatDates : [nextNote.key]);
        if (nextNote.notificate) {
            notificationService.set(nextNote.key, nextNote);
        };

        synchronizationService.syncNote("UPDATE_DYNAMIC_FIELDS", nextNote);

        return nextNote;
    }

    async updateNoteDate(note) {
        await executeSQL(`
            UPDATE Tasks
            SET
                added = ?
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
        await executeSQL(
            `UPDATE Tasks
            SET lastAction = ?, lastActionTime = ?, isLastActionSynced = 0
            WHERE id = ?;`,
            [
                "DELETE",
                actionTime,
                note.key
            ]
        ).catch((err) => console.warn(err));
        notificationService.clear(note.repeatType === "any" ? note.repeatDates : [note.key]);

        synchronizationService.syncNote("DELETE", note);

        return note
    }

    async setNoteRepeat(note) {
        let key = note.forkFrom === -1 ? note.key : note.forkFrom;

        await executeSQL(`DELETE FROM TasksRepeatValues WHERE taskId = ?`, [ key ]).catch((err) => console.warn(err));
        
        if (note.repeatType === "no-repeat") {
            return
        }

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
                        return `(${key}, ${currentValue})`;
                    }
                    return `${accumulator}, (${key}, ${currentValue})`;
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

    calculateTimeCheckSum (note) {
        let startTimeCheckSum = note.startTime ? note.startTime.valueOf() - note.added : 0;
        let endTimeCheckSum = note.endTime ? note.endTime.valueOf() - note.added : 0;

        return {
            startTimeCheckSum,
            endTimeCheckSum
        }
    }

    getTags() {
        return [...tags];
    }

    getTagByIndex(index) {
        return tags[index];
    }

    getRepeatTypeOptions() {
        return [...repeatOptions]
    }
}

let noteService = new NotesService();

export default noteService;