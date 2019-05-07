import moment from "moment";

import executeSQL from '../utils/executeSQL';

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

    hasNetworkConnection() {
        return window.cordova ? navigator.connection.type !== window.Connection.NONE : navigator.onLine;
    }
}

let deviceService = new DeviceService();

export default deviceService;