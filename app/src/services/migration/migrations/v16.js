import execureSQL from "../../../utils/executeSQL";

export default {
    name: "1.6",

    async run() {
        await execureSQL(
            `CREATE TABLE IF NOT EXISTS Migrations
            (
                id INTEGER PRIMARY KEY,
                name TEXT                  
            );`
        );
        
        await execureSQL(`ALTER TABLE Settings RENAME TO Settings_OLD;`);
        await execureSQL(`                           
            CREATE TABLE IF NOT EXISTS Settings
            (
                defaultNotification INTEGER,
                sort TEXT,
                fastAdd INTEGER,
                theme INTEGER,
                password TEXT,    
                fontSize INTEGER,
                showMiniCalendar INTEGER,
                notesShowInterval INTEGER,
                lang TEXT 
            );
        `);
        await execureSQL(`
            INSERT INTO Settings (defaultNotification, fastAdd, theme, password, fontSize) 
            SELECT defaultNotification, fastAdd, colorTheme AS theme, password, fontSize 
            FROM Settings_OLD;
        `);
        await execureSQL(`DROP TABLE Settings_OLD;`);
        let sort = {
            type: 1,
            direction: 1,
            finSort: 0
        }
        
        let lang = navigator.globalization ? (await new Promise((resolve, reject) => navigator.globalization.getPreferredLanguage(resolve, reject))) : "ru";
        if (lang) {
            lang = lang.value || "en";
        }
        if (lang.indexOf("-") !== -1) {
            lang = lang.split("-")[0];
        }
        await execureSQL(`
            UPDATE Settings 
            SET 
                sort = ?, 
                showMiniCalendar = ?,
                notesShowInterval = ?,
                lang = ?;`, 
            [JSON.stringify(sort), 1, 1, lang]
        );
    }
}