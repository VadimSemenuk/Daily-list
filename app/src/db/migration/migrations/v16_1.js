import execureSQL from "../../../utils/executeSQL";
import config from "../../../config/config";
import uuid from "uuid/v1";
import moment from "moment";

export default {
    name: "1.6_1",

    async run() {
        await execureSQL(`ALTER TABLE MetaInfo ADD COLUMN savedTimezone INTEGER;`);
        await execureSQL(`ALTER TABLE MetaInfo ADD COLUMN isPreviousTimezoneProcessed INTEGER;`);
        await execureSQL(`update MetaInfo set isPreviousTimezoneProcessed = 0;`);
    }
}