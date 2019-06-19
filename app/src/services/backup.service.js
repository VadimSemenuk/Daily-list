import i18next from 'i18next';

import notesService from "./notes.service";

import CustomError from "../common/CustomError";
import deviceService from "./device.service";
import apiService from "./api.service";

class BackupService {
    async restoreNotesBackup() {
        if (!deviceService.hasNetworkConnection()) {
            throw new CustomError("no internet connection", i18next.t("internet-required"));
        }

        let notes = await apiService.get('notes/backup')
            .then((res) => res.json());

        if (!notes || !notes.length) {
            throw new CustomError("no backup available", i18next.t("error-no-backup"));
        }

        return await notesService.restoreNotesBackup(notes);    
    }

    async uploadNotesBackup(notes) {
        if (!deviceService.hasNetworkConnection()) {
            throw new CustomError("no internet connection", i18next.t("internet-required"));
        }

        return apiService.post('notes/backup', {notes})
            .then((res) => res.status === 200);
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