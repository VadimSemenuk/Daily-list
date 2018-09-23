import executeSQL from '../utils/executeSQL';
import moment from 'moment';
import config from "../config/config";
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
        let select = await executeSQL(
            `SELECT t.id as key, t.uuid, t.title, t.startTime, t.endTime, t.startTimeCheckSum, t.endTimeCheckSum, t.notificate, t.tag, t.dynamicFields, t.added, t.finished, t.isSynced, t.repeatType
            FROM Tasks t
            LEFT JOIN TasksRepeatValues rep ON t.id = rep.taskId
            WHERE
                t.userId = ? AND
                t.lastAction != 'DELETE' AND
                (
                    (t.repeatType = "no-repeat" AND added = ?) OR
                    t.repeatType = "day" OR
                    (t.repeatType = "week" AND rep.value = ?) OR
                    (t.repeatType = "any" AND rep.value = ?)
                );`,
            [authService.getUserId(), date.valueOf(), date.isoWeekday(), date.valueOf()]
        );

        let unique = {};
        for(let i = 0; i < select.rows.length; i++) {
            let item = select.rows.item(i);

            if (unique[item.key] && !unique[item.key].isShadow) {
                continue;
            }

            let nextItem = {
                ...item,
                dynamicFields: JSON.parse(item.dynamicFields),
                startTime: ~item.startTime ? moment(item.startTime) : false,
                endTime: ~item.endTime ? moment(item.endTime) : false,
                added: moment(item.added),
                finished: Boolean(item.finished),
                notificate: Boolean(item.notificate)
            }

            unique[nextItem.key] = nextItem;
        }
        let notes = Object.values(unique);

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

    async addNote(addedNote) {
        let noteUUID = uuid();
        let actionTime = moment().valueOf();
        let timeCheckSums = this.calculateTimeCheckSum(addedNote);
        let noteToRemoteInsert = {
            ...addedNote,
            startTime: addedNote.startTime ? addedNote.startTime.valueOf() : -1,
            endTime: addedNote.endTime ? addedNote.endTime.valueOf() : -1,
            added: addedNote.added ? addedNote.added.valueOf() : -1,
            uuid: noteUUID,
            dynamicFields: JSON.stringify(addedNote.dynamicFields),
            finished: false,
            lastActionTime: actionTime,
            isSynced: 0,
            ...timeCheckSums
        }
        let noteToLocalInsert = {
            ...noteToRemoteInsert,
            notificate: +noteToRemoteInsert.notificate,
            finished: +noteToRemoteInsert.finished,
            lastAction: "ADD",
            userId: authService.getUserId(),
            isLastActionSynced: 0,
            isSynced: 0,
            uuid: noteUUID
        }

        let noteKey = await this.insertNote(noteToLocalInsert);
        let note = {...addedNote, ...timeCheckSums, key: noteKey};
        await this.setNoteRepeat(note);
        notificationService.clear(note.repeatType === "any" ? note.repeatDates : [note.key]);
        if (note.notificate) {
            notificationService.set(note.key, note);
        };

        if (false && (window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine)) {
            this.insertNoteRemote(noteToRemoteInsert).then(() => synchronizationService.setSynced(note.key));
        }

        return note;
    }

    async insertNote(note) {
        let insert = await executeSQL(
            `INSERT INTO Tasks
            (uuid, title, startTime, endTime, startTimeCheckSum, endTimeCheckSum, notificate, tag, dynamicFields, added, finished, lastAction, lastActionTime, userId, isSynced, isLastActionSynced, repeatType)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
                note.uuid,
                note.title,
                note.startTime,
                note.endTime,
                note.startTimeCheckSum,
                note.endTimeCheckSum,
                note.notificate,
                note.tag,
                note.dynamicFields,
                note.added,
                note.finished,
                note.lastAction,
                note.lastActionTime,
                note.userId,
                note.isSynced,
                note.isLastActionSynced,
                note.repeatType
            ]
        ).catch((err) => console.warn(err));


        return insert.insertId
    }

    async setNoteCheckedState(note, state) {
        let actionTime = moment().valueOf();
        let update = await executeSQL(
            `UPDATE Tasks
            SET finished = ?, isLastActionSynced = 0, lastAction = ?, lastActionTime = ?
            WHERE id = ?;`,
            [
                +state,
                "EDIT",
                actionTime,
                note.key
            ]
        ).catch((err) => console.warn(err))
        if (!update) {
            return
        }

        if (false && (window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine)) {
            fetch(`${config.apiURL}/notes/finish-state`, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authService.getToken()
                },
                body: JSON.stringify({
                    note: {
                        state,
                        uuid: note.uuid,
                        lastActionTime: actionTime
                    },
                    deviceId: window.DEVICE_IMEI,

                })
            })
                .then(() => synchronizationService.setSynced(note.key))
                .catch((err) => console.warn(err));
        }
    }

    async updateNoteDynamicFields(note, dynamicData) {
        let actionTime = moment().valueOf();
        let update = await executeSQL(
            `UPDATE Tasks
            SET dynamicFields = ?, isLastActionSynced = 0, lastAction = ?, lastActionTime = ?
            WHERE id = ?;`,
            [
                JSON.stringify(dynamicData),
                "EDIT",
                actionTime,
                note.key
            ]
        ).catch((err) => console.warn(err));
        if (update) {
            return
        }

        if (false && (window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine)) {
            fetch(`${config.apiURL}/notes/dynamic-fields`, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authService.getToken()
                },
                body: JSON.stringify({
                    note: {
                        dynamicData,
                        uuid: note.uuid,
                        lastActionTime: actionTime
                    },
                    deviceId: window.DEVICE_IMEI
                })
            })
                .then(() => synchronizationService.setSynced(note.key))
                .catch((err) => console.warn(err));
        }
    }

    async updateNote(updatedNote) {
        let actionTime = moment().valueOf();
        let timeCheckSums = this.calculateTimeCheckSum(updatedNote);
        let note = {
            ...updatedNote,
            startTime: updatedNote.startTime ? updatedNote.startTime.valueOf() : -1,
            endTime: updatedNote.endTime ? updatedNote.endTime.valueOf() : -1,
            added: updatedNote.added ? updatedNote.added.valueOf() : -1,
            dynamicFields: JSON.stringify(updatedNote.dynamicFields),
            lastActionTime: actionTime,
            ...timeCheckSums
        }

        await executeSQL(
            `UPDATE Tasks
            SET
                title = ?,
                startTime = ?,
                endTime = ?,
                startTimeCheckSum = ?, 
                endTimeCheckSum = ?,
                notificate = ?,
                tag = ?,
                dynamicFields = ?,
                added = ?,
                finished = ?,
                isLastActionSynced = 0,
                lastAction = ?,
                lastActionTime = ?,
                repeatType = ?
            WHERE id = ?;`,
            [
                note.title,
                note.startTime,
                note.endTime,
                note.startTimeCheckSum,
                note.endTimeCheckSum,
                +note.notificate,
                note.tag,
                note.dynamicFields,
                note.added,
                +note.finished,
                "EDIT",
                actionTime,
                note.repeatType,
                note.key
            ]
        ).catch((err) => console.log('Error: ', err));
        await this.setNoteRepeat(updatedNote);
        notificationService.clear(updatedNote.repeatType === "any" ? updatedNote.prevNote.repeatDates : [updatedNote.key]);
        if (updatedNote.notificate) {
            notificationService.set(updatedNote.key, updatedNote);
        };

        if (false && (window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine)) {
            fetch(`${config.apiURL}/notes`, {
                method: "PUT",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authService.getToken()
                },
                body: JSON.stringify({
                    note,
                    deviceId: window.DEVICE_IMEI
                })
            })
                .then(() => synchronizationService.setSynced(note.key))
                .catch((err) => console.warn(err));
        }

        return {...updatedNote, ...timeCheckSums}
    }

    async updateNoteDate(note) {
        await executeSQL(`
            UPDATE Tasks
            SET added = ?
            WHERE id = ?;
        `, [note.added.valueOf(), note.key])

        notificationService.clear(note.repeatType === "any" ? note.repeatDates : [note.key]);
        if (note.notificate) {
            notificationService.set(note.key, note);
        };
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

        if (false && (window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine)) {
            fetch(`${config.apiURL}/notes`, {
                method: "DELETE",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authService.getToken()
                },
                body: JSON.stringify({
                    note: {
                        uuid: note.uuid,
                        lastActionTime: actionTime
                    },
                    deviceId: window.DEVICE_IMEI
                })
            })
                .then(() => synchronizationService.setSynced(note.key))
                .catch((err) => console.warn(err));
        }

        return note
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
        let select = await executeSQL(`SELECT value from TasksRepeatValues WHERE taskId = ?`, [note.key]);

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