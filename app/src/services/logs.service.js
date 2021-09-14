import executeSQL from '../utils/executeSQL';
import apiService from "./api.service";
import deviceService from "./device.service";
import config from "../config/config";

class LogsService {
    async logLoad(deviceId) {
        if (!config.logs.load) {
            return;
        }

        if (!deviceService.hasNetworkConnection()) {
            return executeSQL(`INSERT INTO LoadLogs (date, deviceId) VALUES (?, ?)`, [+new Date(), deviceId]);
        } else {
            apiService.post('log/load', {deviceId})
                .catch((err) => console.log(err));
        }
    }

    async uploadSavedLoadLogs() {
        if (!config.logs.load) {
            return;
        }

        if (!deviceService.hasNetworkConnection()) {
            return null;
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

    logError(err, additionalInto, deviceId) {
        console.warn(err);

        if (!config.logs.error) {
            return;
        }

        if (err.constructor && err.constructor.name === "SQLError") {
            err = new Error(`code: ${err.code}; message: ${err.message}`);
            err.name = "SQLError";
        }

        if (err.constructor && err.constructor.name === "FileError") {
            err = new Error(`code: ${err.code}`);
            err.name = "FileError";
        }

        let log = {
            name: err.name,
            message: err.message,
            additionalInto,
        };

        if (!deviceService.hasNetworkConnection()) {
            return executeSQL(`INSERT INTO ErrorLogs (date, message, deviceId) VALUES (?, ?, ?)`, [+new Date(), JSON.stringify(log), deviceId]);
        } else {
            apiService.post('log/error', {message: log, deviceId})
                .catch((err) => console.log(err));
        }
    }

    async uploadSavedErrorLogs() {
        if (!config.logs.error) {
            return;
        }

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
}

let logsService = new LogsService();

export default logsService;