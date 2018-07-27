import config from '../config/config.js';

export default () => {
    return new Promise((resolve, reject) => {
        if (window.cordova) {
            window.sqlitePlugin.openDatabase(config.db, resolve, reject)            
        } else {
            resolve(window.openDatabase(config.db.name, config.db.version, config.db.displayname, config.db.size))           
        }
    })
}