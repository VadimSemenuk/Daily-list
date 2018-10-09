import i18next from 'i18next';

import filesService from "./files.service";
import authService from "./auth.service";

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

        await new Promise((resolve, reject) => {
            fileEntry.file(function (file) {
                let reader = new FileReader();
                reader.onloadend = function () {
                    let blob = new Blob([new Uint8Array(this.result)], { type: "application/x-sqlite3" });
                    let oReq = new XMLHttpRequest();
                    oReq.open("PATCH", `https://www.googleapis.com/upload/drive/v3/files/${token.backupFile.id}?uploadType=media&fields=modifiedTime,name,id`, true);
                    oReq.setRequestHeader("Content-Type", "application/x-sqlite3");
                    oReq.setRequestHeader("Authorization", token.token);
                    oReq.onload = function () {
                        resolve({backupFile: token.backupFile});
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
    
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.onwriteend = function() {
                        resolve(true);
                    };
                    fileWriter.onerror = function(e) {
                        reject(e);
                    };
                    fileWriter.write(blob);
                });
            };
            oReq.send(null);
        });
    }
}

let backupService = new BackupService();

export default backupService;