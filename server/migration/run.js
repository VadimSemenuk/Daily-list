const files = [
    require('./migrations/init')  
];

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, "../.env")});
const { Client } = require('pg'),
    fs       = require('fs'),
    config   = require('../server/config').db;

require.extensions['.txt'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

require.extensions['.sql'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

class Migration {
    async createDBIfNotExist() {
        const client = new Client({
            user    : config.user,
            host    : config.host,
            database: 'postgres',
            password: config.password,
            port    : config.port
        });

        await client.connect();
        let dbsResult = await client.query(`SELECT datname FROM pg_database where datname = $1`, [config.database]);
        if (dbsResult.rows.length === 0) {
            await client.query(`CREATE DATABASE ${config.database};`);
        }

        client.end();
    };

    async add() {
        let data = require('./migration_template.txt');
        fs.writeFileSync(path.join(__dirname, 'migrations/new-migration.js'), data);
    };

    async up(options) {
        await this.createDBIfNotExist();
        let DB = require('./../server/db');
        let tableExists = Boolean((await DB.query(`
				SELECT table_schema,table_name
				FROM information_schema.tables
				WHERE table_name = '_migrations'`)).rows.length);
        let migrations = tableExists ? (await DB.query('SELECT * from _migrations')).rows : [];

        if(options && options.prod) {
            files.push(require('./migrations/remove-test-values'));
        }

        let toUp = (files.filter((a) => !migrations.some((b) => a.id === b.name)));
       
        if(toUp.length===0) {
            console.log(`DB is up to date`);
        }

        for (let m of toUp) {
            console.log(`STARTED ${m.id}`);
            await m.up(DB);

            await DB.query(
                'INSERT INTO _migrations ("name", "date") VALUES($name, $date) RETURNING *',
                { name: m.id, date: new Date() }
            );
            console.log(`FINISHED ${m.id}`);
        }
    }

    async down() {
        let DB = require('./../server/db');
        let migrations = await DB.query('select * from _migrations order by date DESC');
        let toDown;
        if (files.length) {
            if (process.argv.slice(2)[1]) {
                try {
                    toDown = migrations.rows.slice(0, migrations.rows.findIndex((a) => a.name === process.argv.slice(2)[1]));
                } catch (e) {
                    console.log('File not found \n' + e);
                    return;
                }
            } else {
                toDown = migrations.rows;
            }
        } else {
            console.log('No files');
            return;
        }

        console.log(toDown);
        for (let m of toDown) {
            m = files.find((a) => a.id === m.name);
            await m.down(DB);
            await DB.query(
                'DELETE FROM _migrations WHERE name = ($1) RETURNING *',
                [
                    m.id
                ]
            );
        }

    }
}

let migration = new Migration();

switch (process.argv[2]) {
case '--up':
    migration.up()
        .then(() => {
            process.exit()
        })
        .catch((err) => console.error(err));
    break;
case '--down':
    migration.down().catch((err) => console.error(err));
    break;
case '--add':
    migration.add().catch((err) => console.error(err));
    break;
case '--prod':
    migration.up({ prod: true }).catch((err) => console.error(err));
    break;
default:
    migration.up().catch((err) => console.error(err));
    break;
}
