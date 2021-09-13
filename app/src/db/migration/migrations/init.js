import moment from "moment";
import i18n from "../../../i18n/index"

import execureSQL from "../../../utils/executeSQL";

import InitialNoteImg from "../../../assets/img/initial-note-example-image.jpg"
import getDefaultLanguage from "../../../utils/getDefaultLanguage";

export default {
    name: "init",

    async run() {
        await createTables();
        await fillDb();
    }
}

async function createTables () {
    await execureSQL(
        `CREATE TABLE IF NOT EXISTS Tasks
        (
            id INTEGER PRIMARY KEY,
            title TEXT,
            startTime INTEGER,
            endTime INTEGER,
            notificate INTEGER,
            tag TEXT,
            dynamicFields TEXT,
            added INTEGER,
            finished INTEGER DEFAULT 0                
        );`
    );
    
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
    );
}

async function fillDb () {
    await execureSQL(
        `INSERT INTO Settings
        (defaultNotification, sort, fastAdd, colorTheme, fontSize, finishedSort, autoBackup)
        VALUES (1, 3, 1, 0, 14, 1, 0);`
    );

    await addInitNote();
}

async function addInitNote() {
    let lang = getDefaultLanguage();
    let translator = i18n.init(lang);

    let initNote = {
        endTime: -1,
        finished: 0,
        notificate: 0,
        startTime: -1,
        tag: "#c5282f",
        title: translator.t("initial-note-title"),
        added: moment().startOf("day").valueOf(),
        dynamicFields: [
            {
                type: "text",
                value: translator.t("initial-note-ci-1")
            },
            {
                type: "text",
                value: translator.t("initial-note-ci-2")
            },
            {
                type: "text",
                value: `  ${translator.t("initial-note-ci-3")}`
            },
            {
                type: "text",
                value: `  ${translator.t("initial-note-ci-4")}`
            },
            {
                type: "listItem",
                value: translator.t("initial-note-ci-5"),
                checked: false
            },
            {
                type: "listItem",
                value: translator.t("initial-note-ci-6"),
                checked: true
            },
            {
                type: "listItem",
                value: translator.t("initial-note-ci-7"),
                checked: false
            },
            {
                type: "text",
                value: `  ${translator.t("initial-note-ci-8")}`
            },
            {
                type: "snapshot",
                value: InitialNoteImg
            },
            {
                type: "text",
                value: translator.t("initial-note-ci-9")
            },
            {
                type: "listItem",
                value: translator.t("initial-note-ci-10"),
                checked: false
            },
            {
                type: "listItem",
                value: translator.t("initial-note-ci-11"),
                checked: false
            },
            {
                type: "listItem",
                value: translator.t("initial-note-ci-12"),
                checked: false
            },
            {
                type: "listItem",
                value: translator.t("initial-note-ci-13"),
                checked: false
            },
            {
                type: "text",
                value: translator.t("initial-note-ci-14")
            },
            {
                type: "text",
                value: translator.t("initial-note-ci-15")
            },
            {
                type: "text",
                value: translator.t("initial-note-ci-16")
            },
            {
                type: "text",
                value: translator.t("initial-note-ci-17")
            },
            {
                type: "text",
                value: translator.t("initial-note-ci-18")
            },
            {
                type: "text",
                value: translator.t("initial-note-ci-19")
            },
            {
                type: "text",
                value: translator.t("initial-note-ci-20")
            }
        ]
    }

    return execureSQL(`
        INSERT INTO Tasks
        (title, startTime, endTime, notificate, tag, dynamicFields, added, finished)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        initNote.title,
        initNote.startTime, 
        initNote.endTime, 
        initNote.notificate, 
        initNote.tag, 
        JSON.stringify(initNote.dynamicFields), 
        initNote.added, 
        initNote.finished
    ]);
}