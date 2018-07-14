import executeSQL from '../utils/executeSQL';
import moment from 'moment';
import config from "../config/config";
import uuid from "uuid/v1";
import synchronizationService from "./synchronization.service";
import authService from "./auth.service";

class NotesService {
    async getDayNotes(date, settings) {
        let select = await executeSQL(
            `SELECT id as key, uuid, title, startTime, endTime, notificate, tag, dynamicFields, added, finished, isSynced
            FROM Tasks
            WHERE added = ? AND userId = ? AND lastAction != 'DELETE';`, 
            [date.valueOf(), authService.getUserId()]
        );              

        if (select.rows) {
            let result = select.rows;    
            let parsed = []; 
            for(let i = 0; i < result.length; i++) {
                let item = result.item(i);
                item.dynamicFields = JSON.parse(item.dynamicFields);
                ~item.startTime ? item.startTime = moment(item.startTime) : item.startTime = false;
                ~item.endTime ? item.endTime = moment(item.endTime) : item.endTime = false;
                ~item.added ? item.added = moment(item.added) : item.added = false;
                item.finished = !!item.finished;
                item.notificate = !!item.notificate;                
                parsed.push(item);
            }         
            return parsed;
        }
    }

    async getNotesByDates (dates, settings) {
        let tasks = dates.map((a) => this.getDayNotes(a, settings));
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
            lastActionTime: actionTime
        }   
        let noteToLocalInsert = {
            ...noteToRemoteInsert,
            notificate: +noteToRemoteInsert.notificate,
            finished: +noteToRemoteInsert.finished,            
            lastAction: "ADD",
            userId: authService.getUserId(),
            isLastActionSynced: 0
        }

        let inserted = this.insertNote(noteToLocalInsert);
        if (!inserted) {
            return
        }

        if (window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine) {
            this.insertNoteRemote(noteToRemoteInsert).then(() => synchronizationService.setSynced(inserted.insertId));
        }

        return {
            ...addedNote,
            key: inserted.insertId,
            uuid: noteUUID
        }
    }

    async insertNote(note) {
        let insert = await executeSQL(
            `INSERT INTO Tasks
            (uuid, title, startTime, endTime, notificate, tag, dynamicFields, added, finished, lastAction, lastActionTime, userId, isSynced, isLastActionSynced)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
                note.isLastActionSynced
            ]
        ).catch((err) => console.warn(err));
        
        return insert;
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

        if (window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine) {
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

        if (window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine) {
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

        if (window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine) {
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

        let update = await executeSQL(
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
                lastActionTime = ? 
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
                note.key
            ]
        ).catch((err) => console.log('Error: ', err));
        if (!update) {
            return
        }

        if (window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine) {
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

    async checkNoteExisting(id) {
        let res = await executeSQL(
            `SELECT id 
            FROM Tasks 
            WHERE id = ?;`,
            [id]
        ).catch((err) => console.log('Error: ', err));

        return res.rows.length
    }
}

let noteService = new NotesService();

export default noteService;