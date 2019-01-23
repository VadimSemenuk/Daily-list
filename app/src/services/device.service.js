import executeSQL from '../utils/executeSQL';
import config from '../config/config';
import throttle from "../utils/throttle";

class DeviceService {
    setNextVersionMigrationState(state) {
        return executeSQL(`UPDATE MetaInfo SET nextVersionMigrated = ?;`, [+state]);
    }

    async getMetaInfo() {
        let select = await executeSQL(`SELECT deviceId, IsRateDialogShowed, nextVersionMigrated FROM MetaInfo;`);
        if (select.rows) {
            let metaInfo = select.rows.item(0);
            return {
                deviceId: metaInfo.deviceId,
                IsRateDialogShowed: Boolean(metaInfo.IsRateDialogShowed),
                nextVersionMigrated: Boolean(metaInfo.nextVersionMigrated)
            }
        } else {
            return {}
        }
    }
    
    async getDeviceId() {
        let select = await executeSQL(`SELECT deviceId FROM MetaInfo;`);
        if (select.rows && select.rows.length && select.rows.item(0)) {
            return select.rows.item(0).deviceId
        }
    }

    async logLoad(deviceId) {
        return fetch(`${config.apiURL}/log/load`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({deviceId})        
        }).catch((err) => console.warn(err));
    }

    logError = throttle((err, additionalInto) => {
        console.warn(err);

        if (err.constructor && err.constructor.name === "SQLError") {
            err = new Error(`code: ${err.code}; message: ${err.message}`);
            err.name = "SQLError";
        }
        
        let log = {
            name: err.name,
            message: err.message,
            additionalInto
        };

        if (window.cordova ? navigator.connection.type === window.Connection.NONE : !navigator.onLine) {
            return executeSQL(`INSERT INTO ErrorLogs (date, message) VALUES (?, ?)`, [+new Date(), JSON.stringify(log)]);
        }

        return fetch(`${config.apiURL}/log/error`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(log)        
        }).catch((err) => console.warn(err));
    }, 5000);

    async logSaved() {
        if (window.cordova ? navigator.connection.type === window.Connection.NONE : !navigator.onLine) {
            return false;
        }
        let select = await executeSQL(`SELECT date, message FROM ErrorLogs`);

        if (select && select.rows.length) {
            let logs = [];
            for (let i = 0; i < select.rows.length; i++) {
                let item = select.rows.item(i);
                logs.push({
                    date: new Date(item.date),
                    message: JSON.parse(item.message)
                });
            }

            let logged = await fetch(`${config.apiURL}/log/error`, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(logs)
            })
                .then((res) => {
                    return res.status === 200;
                })
                .catch((err) => console.warn(err));

            if (logged) {
                executeSQL(`DELETE FROM ErrorLogs`);
            }
        }
    }
}

let deviceService = new DeviceService();

export default deviceService;