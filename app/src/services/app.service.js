import execureSQL from "../utils/executeSQL";
import moment from 'moment';

import migrateService from "./migrate.service";
import notesService from "./notes.service";

class AppService {
    async createDB () {
        try {
            if ((await execureSQL(`SELECT name FROM sqlite_master WHERE type='table' AND name='Tasks';`)).rows.length) {
                console.log('Using existing DB')
                return
            }
    
            console.log('Filling DB'); 

            await execureSQL('DROP TABLE IF EXISTS Settings;');
            await execureSQL('DROP TABLE IF EXISTS Tasks;');           
            console.log('DROP TABLES');
    
            await execureSQL(
                `CREATE TABLE IF NOT EXISTS Tasks
                (
                    id INTEGER PRIMARY KEY,
                    uuid TEXT,
                    title TEXT,
                    startTime INTEGER,
                    endTime INTEGER,
                    notificate INTEGER,
                    tag TEXT,
                    dynamicFields TEXT,
                    added INTEGER,
                    finished INTEGER DEFAULT 0,
                    isSynced INTEGER DEFAULT 0,
                    isLastActionSynced INTEGER DEFAULT 0,
                    lastAction TEXT,
                    lastActionTime INTEGER,
                    userId INTEGER,
                    UNIQUE (uuid) ON CONFLICT REPLACE                    
                );`
            )
            console.log('Tasks table created');
    
            await execureSQL(
                `CREATE TABLE IF NOT EXISTS Settings
                (
                    defaultNotification INTEGER DEFAULT 1,
                    sort INTEGER DEFAULT 4,
                    fastAdd INTEGER DEFAULT 1,
                    colorTheme INTEGER DEFAULT 0,
                    password TEXT,    
                    fontSize INTEGER DEFAULT 14,
                    finishedSort INTEGER DEFAULT 1,
                    autoBackup INTEGER DEFAULT 0
                );`
            )
            console.log('Settings table created');
    
            await execureSQL(
                `INSERT INTO Settings
                (defaultNotification, sort, fastAdd, colorTheme, fontSize, finishedSort, autoBackup)
                VALUES (1, 3, 0, 0, 14, 1, 0);`
            )
            console.log('Settings table filled');
            console.log('Tasks table created');

            let legacyData = migrateService.checkToLegacyData();
            if (legacyData) {
                try {
                    await migrateService.migrateLegacyData(legacyData);
                    localStorage.removeItem("DLData");
                } catch (err) {
                    console.log(err);
                }
            } else {
                // this.addInitNote();            
            }
        } catch (error) {
            console.log('Transaction error: ', error.message);
        }
    }

    addInitNote() {
        notesService.addNote({
            endTime: false,
            finished: 0,
            notificate: false,
            pictureSourceModal: false,
            startTime: false,
            tag: "#c5282f",
            title: "Приветствую",
            added: moment().startOf("day"),
            dynamicFields: [
                {
                    type: "text",
                    value:"Это - пример того, как выглядит типичная заметка в Ежедневнике.  Нажмите на заметку что-бы увидеть полное содержание.\nЗаметка может содержать в себе:"
                },
                {
                    type: "listItem",
                    value: "Списки",
                    checked: true
                },
                {
                    type: "listItem",
                    value: "Цветовую метку",
                    checked: true
                },
                {
                    type: "listItem",
                    value: "Фото",
                    checked: true
                },
                {
                    type: "listItem",
                    value: "Напоминание",
                    checked: true
                },
                {
                    type: "text",
                    value: "Ежедневник постоянно развивается. В наши ближайшие планы входит:"
                },
                {
                    type: "listItem",
                    value: "Резервное копирование и синхронизация между устройствами",
                    checked: false
                },
                {
                    type: "listItem",
                    value: "Улучшение производительности",
                    checked: false
                },
                {
                    type: "text",
                    value: "Приятного пользования!"
                }
            ]            
        })
    }

    getDeviceIMEI() {
        return new Promise((resolve, reject) => {
            if (window.cordova) {
                window.cordova.plugins.IMEI((err, imei) => err ? reject(err) : resolve(imei)) 
            } else {
                resolve("1")
            }
        })          
    }
}

let appService = new AppService();

export default appService;