import filesService from "./files.service";

class BackupService {
    async createBackupFile(token) {
        let backupFile = await fetch("https://www.googleapis.com/drive/v3/files", {
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
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })            
            .catch((err) => console.warn(err));

        return backupFile || {};
    }

    async getBackupFile(token) {
        let files = await fetch("https://www.googleapis.com/drive/v3/files?spaces=appDataFolder", {
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
                return {};
            })            
            .catch((err) => {
                console.warn(err);
                return {};
            });

        let backupFile = (files.files && files.files.length > 0) ? files.files[0] : {};

        return backupFile;
    } 

    async uploadBackup(token) {
        if (!token.backupFile.id) {
            let backupFile = await this.createBackupFile(token);
            token.backupFile = backupFile;
        }

        let fileEntry = await filesService.getFileEntry(window.cordova.file.applicationStorageDirectory + "databases/com.mamindeveloper.dailylist.db");

        await new Promise((resolve, reject) => {
            fileEntry.file(function (file) {
                let reader = new FileReader();
                reader.onloadend = function () {
                    let blob = new Blob([new Uint8Array(this.result)], { type: "application/x-sqlite3" });
                    let oReq = new XMLHttpRequest();
                    oReq.open("PATCH", `https://www.googleapis.com/upload/drive/v3/files/${token.backupFileId}?uploadType=media`, true);
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
        return new Promise((resolve, reject) => {
            let oReq = new XMLHttpRequest();
            oReq.open("GET", `https://www.googleapis.com/drive/v3/files/${token.backupFileId}?alt=media`, true);
            oReq.setRequestHeader("Authorization", token.token);
            oReq.responseType = "blob";
            oReq.onload = async function () {
                let blob = oReq.response;
    
                let fileEntry = await filesService.getFileEntry(window.cordova.file.applicationStorageDirectory + "databases/com.mamindeveloper.dailylist.db");
    
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.onwriteend = function() {
                        resolve();
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