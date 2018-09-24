import config from "../config/config";
import notesService from "./notes.service"; 
import executeSQL from '../utils/executeSQL';
import authService from "./auth.service";

class SynchronizationService {
    async getNewNotes(deviceId, userId) {
        let notSynkedLocalNotes = await this.getNotSyncedLocalNotes(userId);
        let newNotes = await fetch(`${config.apiURL}/sync/new?deviceId=${deviceId}`, {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authService.getToken()
            }
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                } else {
                    return [];
                }
            })
            .catch((err) => console.warn(err));
        
        if (!newNotes) {
            return false
        }

        return newNotes.filter((note) => {
            let localChangedNote = notSynkedLocalNotes.find((a) => a.uuid === note.uuid);
            if (localChangedNote) {
                return localChangedNote.lastActionTime > note.lastActionTime
            }
            return true
        })
    }   

    async setNewNotes(newNotes, deviceId) {
        let settedNoteUUIDs = [];

        for (let newNote of newNotes) { 
            await notesService.insertNote({
                ...newNote,
                startTime: +newNote.startTime, 
                endTime: +newNote.endTime, 
                notificate: +newNote.notificate, 
                added: +newNote.added,
                finished: +newNote.finished,
                lastActionTime: +newNote.lastActionTime,
                isSynced: 1,
                isLastActionSynced: 1
            });
            settedNoteUUIDs.push(newNote.uuid);
        }

        await fetch(`${config.apiURL}/sync/confirm-local-addition`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authService.getToken()
            },
            body: JSON.stringify({
                settedNoteUUIDs,
                deviceId
            })
        })
            .catch((err) => console.warn(err));
    }

    async getNotSyncedLocalNotesFull(userId) {
        let res = await executeSQL(
            `SELECT uuid, title, startTime, endTime, notificate, tag, dynamicFields, added, finished, lastAction, lastActionTime, isSynced
            FROM Tasks
            WHERE userId = ? AND isLastActionSynced = 0;`, 
            [userId]
        ).catch((err) => console.warn(err));
        
        return [...res.rows];
    }

    async getNotSyncedLocalNotes(userId) {
        let res = await executeSQL(
            `SELECT uuid, lastAction, lastActionTime
            FROM Tasks
            WHERE userId = ? AND isLastActionSynced = 0;`, 
            [userId]
        ).catch((err) => console.warn(err));
        
        return [...res.rows];
    }

    async resetNotSyncedLocalNotes(userId) {
        return await executeSQL(
            `UPDATE Tasks
            SET isSynced = 1, isLastActionSynced = 1
            WHERE userId = ? AND isLastActionSynced = 0;`, 
            [userId]
        ).catch((err) => console.warn(err));
    }

    async sendNewLocalNotes(notSynkedLocalNotes, deviceId, userId) {
        await fetch(`${config.apiURL}/sync/apply-local-changes`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authService.getToken()                
            },
            body: JSON.stringify({
                deviceId,
                notSynkedLocalNotes
            })
        })
            .then((res) => this.resetNotSyncedLocalNotes(userId))
            .catch((err) => console.warn(err))
    }

    setSynced(noteKey) {
        return executeSQL(
            `UPDATE Tasks 
            SET isSynced = 1, isLastActionSynced = 1
            WHERE id = ?;`,
            [noteKey]
        ).catch((err) => console.warn(err));
    }

    async syncNote(action, note) {
        if (true && (window.cordova ? navigator.connection.type === window.Connection.NONE : !navigator.onLine)) {
            return false
        }

        switch(action) {
            case "ADD": {
                await this.insertNote(note);
            }
            
            case "UPDATE": {
                await this.updateNote(note);
            }
            case "UPDATE_FINISHED_STATE": {
                await this.updateFinishedState(note)
            }
            case "UPDATE_DYNAMIC_FIELDS": {
                await this.updateDynamicFields(note);
            }
            case "DELETE": {
                await this.deleteNote(note)
            }   
        }

        this.setSynced(note.key)
    }

    insertNote(note) {
        return this.syncRequest("/notes", "POST", { 
            note
        })
    }

    updateNote(note) {
        return this.syncRequest("/notes", "PUT", {
            note
        })
    }

    updateFinishedState(note) {
        return this.syncRequest("/notes/finish-state", "POST", {
            note: {
                state: note.state,
                uuid: note.uuid,
                lastActionTime: note.lastActionTime
            }
        })
    }

    updateDynamicFields(note) {
        return this.syncRequest("/notes/dynamic-fields", "POST", {
            note: {
                dynamicFields: note.dynamicFields,
                uuid: note.uuid,
                lastActionTime: note.lastActionTime
            }
        })
    }

    deleteNote(note) {
        return this.syncRequest("/notes", "DELETE", {
            note: {
                uuid: note.uuid,
                lastActionTime: note.lastActionTime
            }
        })
    }

    syncRequest(path, method, body) {
        return fetch(`${config.apiURL}${path}`, {
            method,
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authService.getToken()
            },
            body: JSON.stringify({...body, deviceId: window.DEVICE_IMEI})
        })
        .catch((err) => console.warn(err));
    }
}

let synchronizationService = new SynchronizationService();

export default synchronizationService;