import executeSQL from '../utils/executeSQL';
import config from '../config/config';

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

    async logError(err, additionalInto) {
        // add debounce
        // add device id
        console.warn(err);

        if (err.constructor && err.constructor.name === "SQLError") {
            err = new Error(`code: ${err.code}; message: ${err.message}`);
            err.name = "SQLError";
        }
        
        let log = {
            name: err.name,
            message: err.message,
            additionalInto
        }

        return fetch(`${config.apiURL}/log/error`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(log)        
        }).catch((err) => console.warn(err));
    }
}

let deviceService = new DeviceService();

export default deviceService;