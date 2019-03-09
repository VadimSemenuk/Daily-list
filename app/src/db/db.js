import config from '../config/config.js';

export default async () => {
    return new Promise((resolve, reject) => {
        if (window.cordova) {
            window.sqlitePlugin.openDatabase({
                name: config.db.name,
                location: config.db.location,
            }, resolve, reject)
        } else {
            resolve(window.openDatabase(config.db.name, config.db.version, config.db.displayname, config.db.size))
        }
    })
}