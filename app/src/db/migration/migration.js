import execureSQL from "../../utils/executeSQL";
import migrations from "./migrations";
import {init} from "./migrations";
import {addFakeListItemsData} from "../../utils/fakeData";

window.execureSQL = execureSQL;

class Migration {
    async checkDBExisting() {
        return (await execureSQL(`SELECT name FROM sqlite_master WHERE type='table' AND name='Tasks';`)).rows.length;
    }

    async initDb() {
        return init.run();
    }

    async getNewMigrations() {
        try {
            let select = (await execureSQL(`SELECT name FROM migrations;`)).rows;
            let appliedMigrations = [];  
            for(let i = 0; i < select.length; i++) {
                appliedMigrations.push(select.item(i));
            };
            return migrations.filter((a) => !appliedMigrations.some((b) => a.name === b.name));
        } catch (err) {      
            console.warn(err);  
            if (!(await execureSQL(`SELECT name FROM sqlite_master WHERE type='table' AND name='Migrations';`)).rows.length) {
                return migrations
            }  
        }
    }

    acceptMigration(migration) {
       return execureSQL(`INSERT INTO migrations (name) VALUES (?)`, [migration.name]);
    }

    async run() {
        let isDbExist = await this.checkDBExisting();
        if (!isDbExist) {
            await this.initDb();
        }

        let newMigrations = await this.getNewMigrations();
        if (newMigrations) {
            for (let migration of newMigrations) {
                await migration.run();
                await this.acceptMigration(migration);
            }
        }

        if (!isDbExist) {
            addFakeListItemsData();
        }
    }
}

let migration = new Migration();

export default migration;