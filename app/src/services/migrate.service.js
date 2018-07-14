import moment from "moment";
import execureSQL from "../utils/executeSQL";

class MigrateService {
    constructor() {
        this.legacyColors = {
            imp0: "#fff",
            imp1: "#00213C",
            imp2: "#c5282f",
            imp3: "#62A178",
            imp4: "#3498DB",
            imp5: "#BF0FB9",
            imp6: "#9A6B00",
            imp7: "#9CECC5"
        }
    }

    checkToLegacyData() {
        let data = localStorage.getItem("DLData");
        if (data) {
            return JSON.parse(data);
        } else {
            return false;
        }
    }

    async migrateLegacyData(legacyData) {
        let dates = Object.keys(legacyData);

        if (dates.length) {
            for(let date of dates) {
                let dateContent = legacyData[date];

                if (dateContent.length) {
                    for (let note of dateContent) {
                        if (!note) {
                            return
                        }

                        let dynamicItems = [];
                        if (note.cnt.length) {
                            note.cnt.forEach((item) => {
                                if (!item) {
                                    return
                                }

                                if (item.type === 0) {
                                    dynamicItems.push(
                                        {
                                            type: "text",
                                            value: item.cnt
                                        }
                                    )
                                }
                                if (item.type === 1) {
                                    dynamicItems.push(
                                        {
                                            type: "listItem",
                                            value: item.cnt,
                                            checked: item.cross === "checked"
                                        }
                                    )
                                }
                            })
                        }

                        await execureSQL(
                            `INSERT INTO Tasks
                            (title, startTime, endTime, notificate, tag, dynamicFields, added, finished)
                            VALUES(?, ?, ?, ?, ?, ?, ?, ?);`,
                            [
                                note.title, 
                                moment(note.time.for, "HH.mm").valueOf(), 
                                !!note.time.to ? moment(note.time.to, "HH.mm").valueOf() : -1, 
                                0,
                                note.color === "imp0" ? "transparent" : this.legacyColors[note.color],
                                JSON.stringify(dynamicItems),
                                date,
                                0
                            ]
                        ); 
                    }
                }
            }
        }
    }
}

let migrateService = new MigrateService();

export default migrateService;