import uuid from "uuid/v1";

import execureSQL from "../../../utils/executeSQL";
import config from "../../../config/config";

export default {
    name: "1.7",

    async run() {
        await addUUID();
        await addMetaTable();
        await alterTasksTable();
        await forkFromFieldToUUID();

        let token = JSON.parse(localStorage.getItem(config.LSTokenKey)) || {};
        if (!token.id) {
            return
        }
        token.backup = {lastBackupTime: null};
        token.settings = {autoBackup: false};
        localStorage.setItem(config.LSTokenKey, JSON.stringify(token));

        async function addUUID() {
            let select = await execureSQL(`SELECT id from Tasks WHERE uuid is null`);
            let updateValues = [];
            let updateValuesStr = "";
            if (!select.rows) {
                return
            }
            for (let i = 0; i < select.rows.length; i++) {
                let item = select.rows.item(i);
                updateValues.push(item.id);
                updateValues.push(uuid());
                updateValuesStr += ", (?, ?)";
            }
            updateValuesStr = updateValuesStr.slice(2);

            return execureSQL(`
                WITH Tmp(id, uuid) AS (VALUES ${updateValuesStr})
	
                UPDATE Tasks SET uuid = (SELECT uuid FROM Tmp WHERE Tasks.id = Tmp.id) WHERE id IN (SELECT id FROM Tmp);
            `, updateValues);
        }

        async function addMetaTable () {
            await execureSQL(`ALTER TABLE MetaInfo RENAME TO MetaInfo_OLD;`);

            await execureSQL(`
                CREATE TABLE IF NOT EXISTS MetaInfo
                (   
                    deviceId TEXT,
                    IsRateDialogShowed INTEGER,
                    nextVersionMigrated INTEGER
                );
            `)

            await execureSQL(`
                INSERT INTO MetaInfo (deviceId, IsRateDialogShowed, nextVersionMigrated)
                SELECT 
                    deviceId, 
                    0 as IsRateDialogShowed,
                    0 as nextVersionMigrated
                FROM MetaInfo_OLD
            `);

            await execureSQL(`DROP TABLE MetaInfo_OLD;`);
        }

        async function alterTasksTable () {
            let msNow = +new Date(); 
            await execureSQL(`ALTER TABLE Tasks RENAME TO Tasks_OLD;`);
            await execureSQL(`                           
                CREATE TABLE IF NOT EXISTS Tasks
                (
                    id INTEGER PRIMARY KEY,
                    uuid TEXT,
                    title TEXT,
                    added INTEGER,
                    finished INTEGER,
                    dynamicFields TEXT,
                    startTime INTEGER,
                    endTime INTEGER,
                    startTimeCheckSum, 
                    endTimeCheckSum,
                    notificate INTEGER,
                    tag TEXT,
                    isSynced INTEGER,
                    isLastActionSynced INTEGER,
                    lastAction TEXT,
                    lastActionTime INTEGER,
                    userId INTEGER,
                    repeatType INTEGER,
                    forkFrom INTEGER,
                    priority INTEGER,
                    UNIQUE (uuid) ON CONFLICT REPLACE
                );
            `);

            await execureSQL(`
                INSERT INTO Tasks (
                    id, 
                    title, 
                    added,
                    finished,
                    dynamicFields,
                    startTime, 
                    endTime, 
                    startTimeCheckSum, 
                    endTimeCheckSum,
                    notificate, 
                    tag, 
                    isSynced,
                    isLastActionSynced,
                    lastAction,
                    lastActionTime,
                    userId,
                    repeatType,
                    forkFrom,
                    priority
                ) 
                SELECT
                    id, 
                    title, 
                    added,
                    finished,
                    dynamicFields,
                    startTime, 
                    endTime, 
                    startTimeCheckSum, 
                    endTimeCheckSum,
                    notificate, 
                    tag, 
                    isSynced,
                    isLastActionSynced,
                    lastAction,
                    lastActionTime,
                    userId,
                    repeatType,
                    forkFrom,
                    2 as priority
                FROM Tasks_OLD;
            `);

            await execureSQL(`DROP TABLE Tasks_OLD;`);
        }

        async function forkFromFieldToUUID() {
            await execureSQL(`
                update Tasks as t
                set forkFrom =
                    (
                        select (select uuid from Tasks ttt where tt.forkFrom = ttt.id ) original
                        from Tasks tt
                        where t.id = tt.id
                    )
                where forkFrom != -1
            `);
        }
    }
}