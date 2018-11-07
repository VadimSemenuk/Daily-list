import uuid from "uuid/v1";

import execureSQL from "../../../utils/executeSQL";
import config from "../../../config/config";

export default {
    name: "1.7",

    async run() {
        await addUUID();
        await addIsRatedField();

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
	
                UPDATE Tasks SET uuid = (SELECT uuid FROM  Tmp WHERE Tasks.id = Tmp.id) WHERE id IN (SELECT id FROM Tmp);
            `, updateValues);
        }

        async function addIsRatedField () {
            await execureSQL(`ALTER TABLE MetaInfo RENAME TO MetaInfo_OLD;`);

            await execureSQL(`
                CREATE TABLE IF NOT EXISTS MetaInfo
                (   
                    deviceId TEXT,
                    IsRateDialogShowed INTEGER
                );
            `)

            await execureSQL(`
                INSERT INTO MetaInfo (deviceId, IsRateDialogShowed)
                SELECT deviceId, 0 as IsRateDialogShowed FROM MetaInfo_OLD
            `);

            await execureSQL(`DROP TABLE MetaInfo_OLD;`);
        }
    }
}