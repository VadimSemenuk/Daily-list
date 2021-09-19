import i18next from 'i18next';
import moment from "moment";

import filesService from "./files.service";
import authService from "./auth.service";
import deviceService from "./device.service";
import CustomError from "../common/CustomError";
import apiService from "./api.service";
import {convertLocalDateTimeToUTC, convertUTCDateTimeToLocal} from "../utils/convertDateTimeLocale";
import executeSQL from "../utils/executeSQL";
import {NoteAction, NoteMode, NoteRepeatType} from "../constants";
import notificationService from "./notification.service";
import DB from "../db/db";
import migration from "../db/migration/migration";

class BackupService {
    databaseFileName = 'com.mamindeveloper.dailylist.db';

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

        if (backupFile) {
            backupFile.modifiedTime = moment(backupFile.modifiedTime);
        }

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

        return (files.files || []).map((file) => {
            return {
                ...file,
                modifiedTime: moment(file.modifiedTime)
            }
        });
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

        let targetBackupFileName = params.actionType === 'user' ? "DailyListSqliteDBFile" : "DailyListSqliteDBFile_auto";
        let backupFile = user.gdBackup.backupFiles.find((f) => {
            return (f.name === targetBackupFileName) && (f.properties && f.properties.deviceUUID === window.device.uuid);
        });
        if (!backupFile) {
            backupFile = await this.createGDBackupFile(targetBackupFileName);
            authService.setUser({
                ...user,
                gdBackup: {
                    ...user.gdBackup,
                    backupFiles: [...user.gdBackup.backupFiles, backupFile]
                }
            });
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

        await new Promise((resolve, reject) => {
            let oReq = new XMLHttpRequest();
            oReq.open("GET", `https://www.googleapis.com/drive/v3/files/${backupFile.id}?alt=media`, true);
            if (token && token.google) {
                oReq.setRequestHeader("Authorization", token.google.accessToken);
            }
            oReq.responseType = "blob";
            oReq.onload = async () => {
                let blob = oReq.response;

                let fileEntry = await filesService.getFileEntry(`${this.databasesDirectory}${this.databaseFileName}`);
                await filesService.writeFile(fileEntry, blob).catch(reject);
                resolve();
            };
            oReq.send(null);
        });

        window.com_mamindeveloper_dailylist_db = await DB();
        await migration.run();

        await this.updateNotifications();
    }

    async updateNotifications() {
        let msDateUTC = convertLocalDateTimeToUTC(moment().startOf("day").valueOf()).valueOf();
        let select = await executeSQL(
            `SELECT n.id, n.title, n.startTime, n.repeatType, n.contentItems, n.date, n.isNotificationEnabled,
                    (select GROUP_CONCAT(rep.value, ',') from NotesRepeatValues rep where rep.noteId = n.id) as repeatValues
                    FROM Notes n
                    WHERE
                        n.lastAction != ?
                        AND ((n.repeatType = ? AND n.date >= ?) OR (n.repeatType IN (?, ?, ?)))
                        AND n.mode == ?;`,
            [NoteAction.Delete, NoteRepeatType.NoRepeat, msDateUTC, NoteRepeatType.Day, NoteRepeatType.Week, NoteRepeatType.Any, NoteMode.WithDateTime]
        );

        let notes = [];
        for(let i = 0; i < select.rows.length; i++) {
            let note = select.rows.item(i);

            let repeatValues = [];
            if (note.repeatValues) {
                repeatValues = note.repeatValues.split(",").map((item) => Number(item));
                if (note.repeatType === NoteRepeatType.Any) {
                    repeatValues = repeatValues
                        .map((item) => convertUTCDateTimeToLocal(item).valueOf())
                        .filter((item) => item > msDateUTC);
                }
            }

            note = {
                ...note,
                date: note.date ? convertUTCDateTimeToLocal(note.date) : note.date,
                startTime: note.startTime ? convertUTCDateTimeToLocal(note.startTime, "second") : note.startTime,
                repeatValues,
                contentItems: JSON.parse(note.contentItems),
                isNotificationEnabled: Boolean(note.isNotificationEnabled)
            };
            notes.push(note);
        }

        await new Promise((resolve) => window.cordova.plugins.notification.local.clearAll(resolve, resolve));

        await new Promise((resolve) => setTimeout(resolve, 500));

        for(let note of notes) {
            if (note.isNotificationEnabled) {
                notificationService.set(note);
                await new Promise((resolve) => setTimeout(resolve, 200));
            }
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
    }
}

let backupService = new BackupService();

export default backupService;