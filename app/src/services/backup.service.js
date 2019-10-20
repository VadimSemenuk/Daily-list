import i18next from 'i18next';
import moment from "moment";

import filesService from "./files.service";
import authService from "./auth.service";
import deviceService from "./device.service";
import CustomError from "../common/CustomError";
import apiService from "./api.service";

class BackupService {
    databaseFileName = 'com.mamindeveloper.dailylist.db';

    setLocalBackupsDirectory() {
        if (!window.cordova) {
            this.localBackupsDirectory = '';
            return;
        }
        this.localBackupsDirectory = window.cordova.file.dataDirectory;
    }
    setDatabasesDirectory() {
        if (!window.cordova) {
            this.databasesDirectory = '';
            return;
        }
        this.databasesDirectory = `${window.cordova.file.applicationStorageDirectory}databases/`;
    }

    async createGDBackupFile(name) {
        if (!deviceService.hasNetworkConnection()) {
            throw new CustomError("no internet connection", i18next.t("internet-required"));
        }

        let backupFile = await apiService.googleApiPost(
            "drive/v3/files?fields=id,name,modifiedTime,properties",
            {
                "name": name,
                "properties": {
                    deviceUUID: window.device.uuid,
                    manufacturer: window.device.manufacturer,
                    model: window.device.model
                },
                "parents": ["appDataFolder"],
            }
        )
            .then(async (res) => {
                if (res.status === 200) {
                    return res.json();
                }
            });

        return backupFile;
    }

    async getGDBackupFiles() {
        let files = await apiService.googleApiGet("drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime,properties)")
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            });

        if (!files) {
            throw Error();
        }

        return files.files;
    }

    async uploadGDBackup(params) {
        if (!window.cordova) {
            return
        }

        if (!deviceService.hasNetworkConnection()) {
            throw new CustomError("no internet connection", i18next.t("internet-required"));
        }

        await apiService.refreshGTokenIfNeed();

        let user = authService.getUser();
        let token = authService.getAuthorizationToken();

        let backupFile = null;
        if (user.gdBackup.backupFiles.length) {
            if (params.actionType === 'user') {
                backupFile = user.gdBackup.backupFiles.find((f) => f.name === 'DailyListSqliteDBFile');
            } else if (params.actionType === 'auto') {
                let files = user.gdBackup.backupFiles.filter((f) => f.name === 'DailyListSqliteDBFile_auto').sort((a, b) => -(a.modifiedTime.diff(b.modifiedTime)));
                backupFile = files[2];
            }
        }
        if (!backupFile) {
            backupFile = await this.createGDBackupFile(params.actionType === 'user' ? "DailyListSqliteDBFile" : "DailyListSqliteDBFile_auto");
            user.gdBackup.backupFiles = [...user.gdBackup.backupFiles, backupFile];
        }

        let fileEntry = await filesService.getFileEntry(`${this.databasesDirectory}${this.databaseFileName}`);

        return new Promise((resolve, reject) => {
            fileEntry.file(function (file) {
                let reader = new FileReader();
                reader.onloadend = function () {
                    let blob = new Blob([new Uint8Array(this.result)], { type: "application/x-sqlite3" });
                    let oReq = new XMLHttpRequest();
                    oReq.open("PATCH", `https://www.googleapis.com/upload/drive/v3/files/${backupFile.id}?uploadType=media&fields=modifiedTime,name,id`, true);
                    oReq.setRequestHeader("Content-Type", "application/x-sqlite3");
                    if (token && token.google) {
                        oReq.setRequestHeader("Authorization", token.google.accessToken);
                    }
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

    async restoreGDBackup(backupFile) {
        if (!window.cordova) {
            return true
        }

        if (!deviceService.hasNetworkConnection()) {
            throw new CustomError("no internet connection", i18next.t("internet-required"));
        }

        await apiService.refreshGTokenIfNeed();

        let token = authService.getAuthorizationToken();

        return new Promise((resolve, reject) => {
            let oReq = new XMLHttpRequest();
            oReq.open("GET", `https://www.googleapis.com/drive/v3/files/${backupFile.id}?alt=media`, true);
            if (token && token.google) {
                oReq.setRequestHeader("Authorization", token.google.accessToken);
            }
            oReq.responseType = "blob";
            oReq.onload = async function () {
                let blob = oReq.response;

                let fileEntry = await filesService.getFileEntry(`${this.databasesDirectory}${this.databaseFileName}`);
                await filesService.writeFile(fileEntry, blob).catch(reject);
                resolve();
            };
            oReq.send(null);
        });
    }

    async getLocalBackups() {
        if (!window.cordova) {
            return [
                {
                    modifiedTime: moment(),
                    name: 'test'
                },
                {
                    modifiedTime: moment(),
                    name: 'test1'
                }
            ]
        }

        let filesEntry = await filesService.getFileEntry(this.localBackupsDirectory);
        let reader = filesEntry.createReader();
        let entries = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
        let backupEntries = [];
        for (let i = 0; i < entries.length; i++) {
            let e = entries[i];
            if (e.isFile && (e.name.indexOf('DailyList_Backup') !== -1)) {
                backupEntries.push(e);
            }
        }
        let backupFiles = [];
        for (let e of backupEntries) {
            let f = await new Promise((resolve, reject) => e.file(resolve, reject));
            backupFiles.push({
                modifiedTime: moment(f.lastModified),
                name: f.name
            });
        }
        return backupFiles;
    }

    async restoreLocalBackup(file) {
        let backupFileEntry = await filesService.getFileEntry(`${this.localBackupsDirectory}${file.name}`);
        let targetDirEntry = await filesService.getFileEntry(this.databasesDirectory);
        return new Promise((resolve, reject) => backupFileEntry.copyTo(targetDirEntry, this.databaseFileName, resolve, reject));
    }

    async saveLocalBackup(fileToUpdate) {
        if (!window.cordova) {
            return
        }

        let fileEntry = await filesService.getFileEntry(`${this.databasesDirectory}${this.databaseFileName}`);
        let targetDirEntry = await filesService.getFileEntry(this.localBackupsDirectory);
        await new Promise((resolve, reject) => fileEntry.copyTo(targetDirEntry, `DailyList_Backup_${moment().valueOf()}.db`, resolve, reject))
        if (fileToUpdate) {
            let fileToUpdateEntry = await filesService.getFileEntry(`${this.localBackupsDirectory}${fileToUpdate.name}`);
            await new Promise((resolve, reject) => fileToUpdateEntry.remove(resolve, reject));
        }
    }
}

let backupService = new BackupService();

export default backupService;