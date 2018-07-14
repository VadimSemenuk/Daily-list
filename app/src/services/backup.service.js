import config from "../config/config";
import permissionSerivce from "./permission.service"

class BackupService {
    makeBackup = async () => {
        if (!window.cordova) return      
        
        await permissionSerivce.checkPermission(
            [
                window.cordova.plugins.permissions.READ_EXTERNAL_STORAGE,
                window.cordova.plugins.permissions.WRITE_EXTERNAL_STORAGE
            ], true
        )

        return new Promise((resolve, reject) => {
            window.resolveLocalFileSystemURL(
                `file:///data/data/${config.appId}/databases/com.mamindeveloper.dailylist.db`, 
                (fs) => {
                    let parent = window.cordova.file.externalRootDirectory;
                    window.resolveLocalFileSystemURL(parent, (directoryEntry) => {
                        fs.copyTo(directoryEntry, "DailyList_Backup.db", resolve, reject);
                    });
                }, 
                reject
            ); 
        });
    }

    importBackup = async () => {
        if (!window.cordova) return     
                
        await permissionSerivce.checkPermission(
            [
                window.cordova.plugins.permissions.READ_EXTERNAL_STORAGE,
                window.cordova.plugins.permissions.WRITE_EXTERNAL_STORAGE
            ], true
        )           

        return new Promise((resolve, reject) => {            
            window.resolveLocalFileSystemURL(
                `${window.cordova.file.externalRootDirectory}DailyList_Backup.db`,
                (fs) => {
                    window.resolveLocalFileSystemURL(`file:///data/data/${config.appId}/databases/`, (directoryEntry) => {
                        fs.copyTo(directoryEntry, "com.mamindeveloper.dailylist.db", resolve, reject);
                    });
                }, 
                reject
            );
        }); 
    }

    checkBackupExist = async () => {
        if (!window.cordova) return                

        return new Promise((resolve) => {
            window.resolveLocalFileSystemURL(
                `${window.cordova.file.externalRootDirectory}DailyList_Backup.db`,
                (fs) => resolve(true), 
                (err) => resolve(false));
        }) 
    }
}

let backupService = new BackupService();

export default backupService;