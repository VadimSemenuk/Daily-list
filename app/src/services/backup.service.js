import i18next from 'i18next';

import notesService from "./notes.service";

import config from "../config/config";

import CustomError from "../common/CustomError";

class BackupService {
    async restoreNotesBackup(token) {
        if (window.cordova ? navigator.connection.type === window.Connection.NONE : !navigator.onLine) {
            throw new CustomError("no internet connection", i18next.t("internet-required"));
        }

        let notes = await fetch(`${config.apiURL}/notes/backup`, {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token.token
            }
        })
            .then((res) => res.json());

        if (!notes || !notes.length) {
            throw new CustomError("no backup available", i18next.t("error-no-backup"));
        }

        return await notesService.restoreNotesBackup(notes);    
    }

    async uploadNotesBatchBackup(notes, token) {
        if (window.cordova ? navigator.connection.type === window.Connection.NONE : !navigator.onLine) {
            throw new CustomError("no internet connection", i18next.t("internet-required"));
        }

        return fetch(`${config.apiURL}/notes/backup/batch`, {
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
    }

    async uploadNoteBackup(note, token, removeForkNotes) {
        if (window.cordova ? navigator.connection.type === window.Connection.NONE : !navigator.onLine) {
            throw new CustomError("no internet connection", i18next.t("internet-required"));
        }

        let method = "POST";
        if (note.isSynced) {
            method = "PUT";
        }

        return fetch(`${config.apiURL}/notes/backup`, {
            method,
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token.token
            },
            body: JSON.stringify({
                note,
                removeForkNotes
            })
        })
            .then((res) => {
                // TODO test statuses
                if (res.status === 200) {
                    return res.json();
                }
            });
    }

    async getUserLastBackupTime(token) {
        if (window.cordova ? navigator.connection.type === window.Connection.NONE : !navigator.onLine) {
            return false;
        }

        return await fetch(`${config.apiURL}/notes/backup/user-last-backup-time`, {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Authorization": token.token
            },
        })
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