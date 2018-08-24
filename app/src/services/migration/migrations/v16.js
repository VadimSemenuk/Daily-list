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
        await execureSQL(`CREATE TABLE IF NOT EXISTS Settings (settings TEXT);`);
        await execureSQL(`DROP TABLE Settings_OLD;`);
        let sort = {
            type: 1,
            direction: 1,
            finSort: 0
        }
        await execureSQL(`
            INSERT INTO Settings (settings) VALUES (?)`, [JSON.stringify({
                defaultNotification: true,
                sort: {
                    type: 1,
                    direction: 1,
                    finSort: 0
                },
                fastAdd: false,
                theme: 0,
                password: null,    
                fontSize: 14,
                showMiniCalendar: false,
                notesShowInterval: 1
            })]
        );
    }
}