import moment from "moment";

import executeSQL from '../utils/executeSQL';
import throttle from "../utils/throttle";
import apiService from "./api.service";

class DeviceService {
    setBackupMigrationState(state) {
        return executeSQL(`UPDATE MetaInfo SET backupMigrated = ?;`, [+state]);
    }

    async getMetaInfo() {
        let select = await executeSQL(`
            SELECT deviceId, isRateDialogShowed, backupMigrated, appInstalledDate
            FROM MetaInfo;
        `);
        if (select.rows) {
            let metaInfo = select.rows.item(0);
            return {
                deviceId: metaInfo.deviceId,
                isRateDialogShowed: Boolean(metaInfo.isRateDialogShowed),
                backupMigrated: Boolean(metaInfo.backupMigrated),
                appInstalledDate: moment(metaInfo.appInstalledDate)
            }
        } else {
            return {}
        }
    }

    async logLoad(deviceId) {
        if (!deviceService.hasNetworkConnection()) {
            return executeSQL(`INSERT INTO LoadLogs (date, deviceId) VALUES (?, ?, ?)`, [+new Date(), deviceId]);
        } else {
            apiService.post('log/load', {deviceId})
                .catch((err) => console.log(err));
        }
    }

    logError = throttle((err, deviceId, additionalInto) => {
        console.warn(err);

        if (err.constructor && err.constructor.name === "SQLError") {
            err = new Error(`code: ${err.code}; message: ${err.message}`);
            err.name = "SQLError";
        }
        
        let log = {
            name: err.name,
            message: err.message,
            additionalInto,
        };

        if (!deviceService.hasNetworkConnection()) {
            return executeSQL(`INSERT INTO ErrorLogs (date, message, deviceId) VALUES (?, ?, ?)`, [+new Date(), JSON.stringify(log), deviceId]);
        } else {
            apiService.post('log/error', {error: log, deviceId})
                .catch((err) => console.log(err));
        }
    }, 5000);

    async uploadSavedErrorLogs() {
        if (!deviceService.hasNetworkConnection()) {
            return false;
        }
        let select = await executeSQL(`SELECT date, message, deviceId FROM ErrorLogs`);

        if (select && select.rows.length) {
            let logs = [];
            for (let i = 0; i < select.rows.length; i++) {
                let item = select.rows.item(i);
                logs.push({
                    date: new Date(item.date),
                    message: JSON.parse(item.message),
                    deviceId: item.deviceId
                });
            }

            let logged = await apiService.post('log/error', logs)
                .then((res) => res.status === 200)
                .catch((err) => console.log(err));

            if (logged) {
                executeSQL(`DELETE FROM ErrorLogs`);
            }
        }
    }

    async uploadSavedLoadLogs() {
        if (!deviceService.hasNetworkConnection()) {
            return false;
        }
        let select = await executeSQL(`SELECT date, deviceId FROM LoadLogs`);

        if (select && select.rows.length) {
            let logs = [];
            for (let i = 0; i < select.rows.length; i++) {
                let item = select.rows.item(i);
                logs.push({
                    date: new Date(item.date),
                    deviceId: item.deviceId
                });
            }

            let logged = await apiService.post('log/load', logs)
                .then((res) => res.status === 200)
                .catch((err) => console.log(err));

            if (logged) {
                executeSQL(`DELETE FROM LoadLogs`);
            }
        }
    }

    hasNetworkConnection() {
        return window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine;
    }
}

let deviceService = new DeviceService();

export default deviceService;