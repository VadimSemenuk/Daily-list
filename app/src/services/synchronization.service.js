import notesService from "./notes.service";
import executeSQL from '../utils/executeSQL';
import apiService from "./api.service";
import deviceService from "./device.service";

class SynchronizationService {
    async getNewNotes(deviceId, userId) {
        let notSynkedLocalNotes = await this.getNotSyncedLocalNotes(userId);
        let newNotes = await apiService.get('sync/new', {deviceId})
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

        await apiService.post('sync/confirm-local-addition', {settedNoteUUIDs, deviceId})
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
        await apiService.post('sync/apply-local-changes', {notSynkedLocalNotes, deviceId})
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
        if (true || !deviceService.hasNetworkConnection()) {
            return false
        }

        switch(action) {
            case "ADD": {
                await this.insertNote(note);
                break;
            }
            case "UPDATE": {
                await this.updateNote(note);
                break;
            }
            case "UPDATE_FINISHED_STATE": {
                await this.updateFinishedState(note);
                break;
            }
            case "UPDATE_DYNAMIC_FIELDS": {
                await this.updateDynamicFields(note);
                break;
            }
            case "DELETE": {
                await this.deleteNote(note);
                break;
            }   
        }

        this.setSynced(note.key)
    }

    insertNote(note) {
        return apiService.post('notes', {note});
    }

    updateNote(note) {
        return apiService.put('notes', {note});
    }


    updateFinishedState(note) {
        return apiService.post('notes/finish-state', {
            note: {
                state: note.state,
                    uuid: note.uuid,
                    lastActionTime: note.lastActionTime
            }
        });
    }

    updateDynamicFields(note) {
        return apiService.post('notes/dynamic-fields', {
            note: {
                dynamicFields: note.dynamicFields,
                uuid: note.uuid,
                lastActionTime: note.lastActionTime
            }
        });
    }

    deleteNote(note) {
        return apiService.delete('notes', {
            note: {
                uuid: note.uuid,
                lastActionTime: note.lastActionTime
            }
        });
    }
}

let synchronizationService = new SynchronizationService();

export default synchronizationService;