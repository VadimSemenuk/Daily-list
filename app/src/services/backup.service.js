import i18next from 'i18next';
import moment from 'moment';

import notesService from "./notes.service";

import config from "../config/config";

class BackupService {
    async restoreNotesBackup(token) {
        if (window.cordova ? navigator.connection.type === window.Connection.NONE : !navigator.onLine) {
            window.plugins.toast.showLongBottom(i18next.t("internet-required"));
            return false;
        }

        let notes = await fetch(`${config.apiURL}/notes/backup`, {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token.token
            }
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })            
            .catch((err) => console.warn(err));
    
        return await notesService.restoreNotesBackup(notes);    
    }

    async uploadNotesBatchBackup(notes, token) {
        if (window.cordova ? navigator.connection.type === window.Connection.NONE : !navigator.onLine) {
            window.plugins.toast.showLongBottom(i18next.t("internet-required"));
            return false;
        }
        if (!notes || !notes.length) {
            return false;
        }

        let isBackuped = await fetch(`${config.apiURL}/notes/backup/batch`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token.token
            },
            body: JSON.stringify({
                notes
            })
        })
            .then((res) => {
                if (res.status === 200) {
                    window.res = res;
                    return res.json();
                }
            })            
            .catch((err) => {
                console.warn(err)
                return false;
            });

        return isBackuped;        
    }

    async uploadNoteBackup(note, token) {
        if (window.cordova ? navigator.connection.type === window.Connection.NONE : !navigator.onLine) {
            window.plugins.toast.showLongBottom(i18next.t("internet-required"));
            return false;
        }

        let method = "POST";
        if (note.isSynced) {
            method = "PUT";
        }

        let isBackuped = await fetch(`${config.apiURL}/notes/backup`, {
            method,
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token.token
            },
            body: JSON.stringify({
                note
            })
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })            
            .catch((err) => {
                console.warn(err)
                return false;
            });

        return isBackuped;
    }

    async getUserLastBackupTime(token) {
        if (window.cordova ? navigator.connection.type === window.Connection.NONE : !navigator.onLine) {
            return
        }

        let time = await fetch(`${config.apiURL}/notes/backup/user-last-backup-time`, {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Authorization": token.token
            },
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })            
            .catch((err) => {
                console.warn(err)
                return null;
            });

        return time;
    }
}

let backupService = new BackupService();

export default backupService;