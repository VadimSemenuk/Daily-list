import i18next from 'i18next';

import filesService from "./files.service";
import authService from "./auth.service";
import notesService from "./notes.service";

import config from "../config/config";
import executeSQL from '../utils/executeSQL';

class BackupService {
    async createBackupFile(token) {
        let backupFile = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name,modifiedTime", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
                "Authorization": token.token
            },
            body: JSON.stringify({
                "name": "DailyListSqliteDBFile",
                "parents": ["appDataFolder"]
            })
        })
            .then(async (res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })            
            .catch((err) => console.warn(err));

        return backupFile;
    }

    async getBackupFile(token) {
        if (token.tokenExpireDate < +new Date()) {
            token = await authService.googleRefreshAccessToken(token);
            if (!token) {
                window.plugins.toast.showLongBottom(i18next.t("error-repeat-common"));
                return false;
            }
        }

        let files = await fetch("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime)", {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
                "Authorization": token.token
            }
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
                return false;
            })            
            .catch((err) => {
                console.warn(err);
                return false;;
            });

        let backupFile = (files && files.files && files.files.length > 0) ? files.files[0] : false;

        return backupFile;
    } 

    async uploadBackup(token) {
        if (window.cordova ? navigator.connection.type === window.Connection.NONE : !navigator.onLine) {
            window.plugins.toast.showLongBottom(i18next.t("internet-required"));
            return false;
        }

        if (token.tokenExpireDate < +new Date()) {
            token = await authService.googleRefreshAccessToken(token);
            if (!token) {
                window.plugins.toast.showLongBottom(i18next.t("error-repeat-common"));
                return false;
            }
        }

        if (!token.backupFile.id) {
            let backupFile = await this.createBackupFile(token);
            if (!backupFile) {
                window.plugins.toast.showLongBottom(i18next.t("error-repeat-common"));
                return false;         
            }
            token.backupFile = backupFile;
        }

        let fileEntry = await filesService.getFileEntry(window.cordova.file.applicationStorageDirectory + "databases/com.mamindeveloper.dailylist.db");

        return new Promise((resolve, reject) => {
            fileEntry.file(function (file) {
                let reader = new FileReader();
                reader.onloadend = function () {
                    let blob = new Blob([new Uint8Array(this.result)], { type: "application/x-sqlite3" });
                    let oReq = new XMLHttpRequest();
                    oReq.open("PATCH", `https://www.googleapis.com/upload/drive/v3/files/${token.backupFile.id}?uploadType=media&fields=modifiedTime,name,id`, true);
                    oReq.setRequestHeader("Content-Type", "application/x-sqlite3");
                    oReq.setRequestHeader("Authorization", token.token);
                    oReq.onload = function () {
                        let backupFile = oReq.response;
                        if (backupFile) {
                            backupFile = JSON.parse(backupFile);
                        }
                        resolve({backupFile});
                    };
                    oReq.send(blob);
                };
                reader.readAsArrayBuffer(file);
            }, reject);
        });
    }

    async restoreBackup(token) {
        if (!window.cordova) {
            return true
        }

        if (window.cordova ? navigator.connection.type === window.Connection.NONE : !navigator.onLine) {
            window.plugins.toast.showLongBottom(i18next.t("internet-required"));
            return false;
        }

        if (token.tokenExpireDate < +new Date()) {
            token = await authService.googleRefreshAccessToken(token);
            if (!token) {
                window.plugins.toast.showLongBottom(i18next.t("error-repeat-common"));
                return false;
            }
        }

        return new Promise((resolve, reject) => {
            let oReq = new XMLHttpRequest();
            oReq.open("GET", `https://www.googleapis.com/drive/v3/files/${token.backupFile.id}?alt=media`, true);
            oReq.setRequestHeader("Authorization", token.token);
            oReq.responseType = "blob";
            oReq.onload = async function () {
                let blob = oReq.response;
    
                let fileEntry = await filesService.getFileEntry(window.cordova.file.applicationStorageDirectory + "databases/com.mamindeveloper.dailylist.db");
                await filesService.writeFile(fileEntry, blob).catch((err) => {
                    console.warn(err);
                    reject(err);
                })
                resolve(true);
            };
            oReq.send(null);
        });
    }

    async restoreLocalBackup() {
        let backupFileEntry = await filesService.getFileEntry(window.cordova.file.externalRootDirectory + "DailyList_Backup.db")
            .catch((err) => console.warn(err));
        if (!backupFileEntry) {
            window.plugins.toast.showLongBottom(i18next.t("error-repeat-common"));
            return false
        }

        let targetDirEntry = await filesService.getFileEntry(window.cordova.file.applicationStorageDirectory + "databases/");
        return new Promise((resolve, reject) => backupFileEntry.copyTo(targetDirEntry, "com.mamindeveloper.dailylist.db", resolve, reject));
    }

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

    async uploadNotesBatchBackup(token) {
        if (window.cordova ? navigator.connection.type === window.Connection.NONE : !navigator.onLine) {
            window.plugins.toast.showLongBottom(i18next.t("internet-required"));
            return false;
        }

        let notes = await notesService.getNoteForBackup();

        await fetch(`${config.apiURL}/notes/backup/batch`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token.token
            },
            body: JSON.stringify({
                notes,
            })
        })
            .then((res) => {
                if (res.status === 200) {
                    return true
                }
            })            
            .catch((err) => console.warn(err));
    }

    async uploadOrScheduleNoteBackup(note, action, token) {
        if (window.cordova ? navigator.connection.type === window.Connection.NONE : !navigator.onLine) {
            window.plugins.toast.showLongBottom(i18next.t("internet-required"));
            return false;
        }

        if (!note.isSynced) {
            action = "ADD";
        }

        
        let httpMethod = null;
        switch(action) {
            case("ADD"): {
                httpMethod = "POST";
                break;
            }
            case("EDIT"): {
                httpMethod = "PUT";
                break;
            }
            case("DELETE"): {
                httpMethod = "DELETE";
                break;
            }
            default: {
                httpMethod = "POST";
            }
        }

        await fetch(`${config.apiURL}/notes/backup`, {
            method: httpMethod,
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
                    return true
                }
            })            
            .catch((err) => console.warn(err));

        return note;
    }
}

let backupService = new BackupService();

export default backupService;