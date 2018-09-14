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
}

let synchronizationService = new SynchronizationService();

export default synchronizationService;