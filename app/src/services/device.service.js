import moment from "moment";

import executeSQL from '../utils/executeSQL';

class DeviceService {
    async getMetaInfo() {
        let select = await executeSQL(`
            SELECT isRateDialogShowed, appInstallDate
            FROM MetaInfo;
        `);

        let meta = {};

        if (select.rows) {
            let metaInfo = select.rows.item(0);
            meta = {
                isRateDialogShowed: Boolean(metaInfo.isRateDialogShowed),
                appInstallDate: moment(metaInfo.appInstallDate)
            }
        }

        return meta;
    }

    hasNetworkConnection() {
        return window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine;
    }
}

let deviceService = new DeviceService();

export default deviceService;