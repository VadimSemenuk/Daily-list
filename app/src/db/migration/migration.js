import execureSQL from "../../utils/executeSQL";
import migrations from "./migrations";
import {init} from "./migrations";
import {addFakeListItemsData} from "../../utils/fakeData";

class Migration {
    async checkDBExisting() {
        return (await execureSQL(`SELECT name FROM sqlite_master WHERE type='table' AND name='Migrations';`)).rows.length !== 0;
    }

    async initDb() {
        return init.run();
    }

    async getNewMigrations() {
        try {
            let select = (await execureSQL(`SELECT name FROM Migrations;`)).rows;
            let appliedMigrations = [];  
            for(let i = 0; i < select.length; i++) {
                appliedMigrations.push(select.item(i));
            }
            return migrations.filter((a) => !appliedMigrations.some((b) => a.name === b.name));
        } catch (err) {
            console.warn(err);  
            if (!(await execureSQL(`SELECT name FROM sqlite_master WHERE type='table' AND name='Migrations';`)).rows.length) {
                return migrations;
            }  
        }
    }

    async getLastMigrationName() {
        try {
            let select = (await execureSQL(`SELECT name FROM Migrations;`)).rows;
            let appliedMigrations = [];
            for(let i = 0; i < select.length; i++) {
                appliedMigrations.push(select.item(i));
            }
            return appliedMigrations[appliedMigrations.length - 1].name;
        } catch (err) {
            console.warn(err);
            return null;
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
            let lastMigrationName = await this.getLastMigrationName();
            for (let migration of newMigrations) {
                await migration.run(isDbExist, lastMigrationName);
                await this.acceptMigration(migration);
            }
        }

        let addFakeData = false;
        if (!isDbExist && addFakeData) {
            await addFakeListItemsData();
        }
    }
}

let migration = new Migration();

export default migration;