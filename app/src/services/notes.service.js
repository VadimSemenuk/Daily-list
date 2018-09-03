import executeSQL from '../utils/executeSQL';
import moment from 'moment';
import config from "../config/config";
import uuid from "uuid/v1";
import synchronizationService from "./synchronization.service";
import authService from "./auth.service";

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
            `SELECT t.id as key, t.uuid, t.title, t.startTime, t.endTime, t.notificate, t.tag, t.dynamicFields, t.added, t.finished, t.isSynced
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
        let noteToRemoteInsert = {
            ...addedNote,
            startTime: addedNote.startTime ? addedNote.startTime.valueOf() : -1,
            endTime: addedNote.endTime ? addedNote.endTime.valueOf() : -1,
            added: addedNote.added ? addedNote.added.valueOf() : -1,
            uuid: noteUUID,
            dynamicFields: JSON.stringify(addedNote.dynamicFields),
            finished: false,
            lastActionTime: actionTime,
            isSynced: 0
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

        let note = await this.insertNote(noteToLocalInsert);
        await this.setNoteRepeat(note);

        if (false && window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine) {
            this.insertNoteRemote(noteToRemoteInsert).then(() => synchronizationService.setSynced(note.key));
        }

        return note;
    }

    async insertNote(note) {
        let insert = await executeSQL(
            `INSERT INTO Tasks
            (uuid, title, startTime, endTime, notificate, tag, dynamicFields, added, finished, lastAction, lastActionTime, userId, isSynced, isLastActionSynced, repeatType)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
                note.uuid,
                note.title, 
                note.startTime, 
                note.endTime, 
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
        
        return {
            ...note,
            key: insert.insertId
        };
    }

    insertNoteRemote(note) {
        return fetch(`${config.apiURL}/notes`, {
            method: "POST",
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
            .catch((err) => console.warn(err));
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

        if (false && window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine) {
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

        if (false && window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine) {
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

    async deleteNote(note) {
        let actionTime = moment().valueOf();     
        let del = await executeSQL(
            `UPDATE Tasks 
            SET lastAction = ?, lastActionTime = ?, isLastActionSynced = 0
            WHERE id = ?;`,
            [
                "DELETE",
                actionTime,
                note.key
            ]
        ).catch((err) => console.warn(err));     
        if (!del) {
            return
        }         

        if (false && window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine) {
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

    async updateNote(updatedNote) {
        let actionTime = moment().valueOf();     
        let note = {
            ...updatedNote,
            startTime: updatedNote.startTime ? updatedNote.startTime.valueOf() : -1,
            endTime: updatedNote.endTime ? updatedNote.endTime.valueOf() : -1,
            added: updatedNote.added ? updatedNote.added.valueOf() : -1,
            dynamicFields: JSON.stringify(updatedNote.dynamicFields),
            lastActionTime: actionTime
        }      

        await executeSQL(
            `UPDATE Tasks 
            SET 
                title = ?, 
                startTime = ?, 
                endTime = ?, 
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
        await this.setNoteRepeat(note);

        if (false && window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine) {
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
    }

    async setNoteRepeat(note) {
        if (note.repeatType === "no-repeat") {
            return
        }

        await executeSQL(`DELETE FROM TasksRepeatValues WHERE taskId = ?`, [ note.key ]).catch((err) => console.warn(err));

        let tasksRepeatValue =  null;
        if (note.repeatType === "week") {
            tasksRepeatValue = moment(note.added).isoWeekday();
        } else if (note.repeatType === "any") {
            tasksRepeatValue = note.added;
        }

        if (tasksRepeatValue !== null) {
            await executeSQL(
                `INSERT INTO TasksRepeatValues
                (taskId, value)
                VALUES(?, ?);`,
                [
                    note.key,
                    tasksRepeatValue
                ]
            ).catch((err) => console.warn(err));
        }
    }

    getTags() {
        return [...tags];
    }

    getTagByIndex(index) {
        return tags[index];
    }
    
    getRepeatTypeOptions() {
        return [{ 
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
        }]
    }
}

let noteService = new NotesService();

export default noteService;