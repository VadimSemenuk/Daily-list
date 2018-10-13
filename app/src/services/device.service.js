import executeSQL from '../utils/executeSQL';
import config from '../config/config';

class DeviceService {
    async getDeviceId() {
        let select = await executeSQL(`SELECT deviceId FROM MetaInfo;`);
        if (select.rows && select.rows.length && select.rows.item(0)) {
            return select.rows.item(0).deviceId
        }
    }

    async logLoad() {
        let deviceId = await this.getDeviceId();

        return fetch(`${config.apiURL}/log/load`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({deviceId})        
        }).catch((err) => console.warn(err))
    }
}

let deviceService = new DeviceService();

export default deviceService;