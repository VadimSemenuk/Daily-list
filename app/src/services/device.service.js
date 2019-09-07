import moment from "moment";

import executeSQL from '../utils/executeSQL';

class DeviceService {
    async getMetaInfo() {
        let select = await executeSQL(`
            SELECT deviceId, isRateDialogShowed, appInstalledDate
            FROM MetaInfo;
        `);
        if (select.rows) {
            let metaInfo = select.rows.item(0);
            return {
                deviceId: metaInfo.deviceId,
                isRateDialogShowed: Boolean(metaInfo.isRateDialogShowed),
                appInstalledDate: moment(metaInfo.appInstalledDate)
            }
        } else {
            return {}
        }
    }

    hasNetworkConnection() {
        return window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine;
    }
}

let deviceService = new DeviceService();

export default deviceService;