import i18next from 'i18next';

import notesService from "./notes.service";

import CustomError from "../common/CustomError";
import deviceService from "./device.service";
import apiService from "./api.service";

class BackupService {
    async restoreNotesBackup(token) {
        if (!deviceService.hasNetworkConnection) {
            throw new CustomError("no internet connection", i18next.t("internet-required"));
        }

        let notes = await apiService.post('notes/backup')
            .then((res) => res.json());

        if (!notes || !notes.length) {
            throw new CustomError("no backup available", i18next.t("error-no-backup"));
        }

        return await notesService.restoreNotesBackup(notes);    
    }

    async uploadNotesBatchBackup(notes) {
        if (!deviceService.hasNetworkConnection()) {
            throw new CustomError("no internet connection", i18next.t("internet-required"));
        }

        apiService.post('notes/backup/batch', {notes});
    }

    async uploadNoteBackup(note, token, removeForkNotes) {
        if (!deviceService.hasNetworkConnection()) {
            throw new CustomError("no internet connection", i18next.t("internet-required"));
        }

        let method = "post";
        if (note.isSynced) {
            method = "put";
        }

        apiService[method]('notes/backup', {note, removeForkNotes})
            .then((res) => {
                // TODO test statuses
                if (res.status === 200) {
                    return res.json();
                }
            });
    }

    async getUserLastBackupTime() {
        if (!deviceService.hasNetworkConnection()) {
            return null;
        }

        return await apiService.get('notes/backup/user-last-backup-time')
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                } else {
                    throw new Error("request failed: " + res.status);
                }
            });
    }
}

let backupService = new BackupService();

export default backupService;