import moment from "moment";
import config from "../../../config/config";

import execureSQL from "../../../utils/executeSQL";

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
    )
    
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
    )
}

async function fillDb () {
    await execureSQL(
        `INSERT INTO Settings
        (defaultNotification, sort, fastAdd, colorTheme, fontSize, finishedSort, autoBackup)
        VALUES (1, 3, 0, 0, 14, 1, 0);`
    )

    await addInitNote();
}

async function addInitNote() {
    let lang = navigator.globalization ? 
        (await new Promise((resolve, reject) => navigator.globalization.getPreferredLanguage(resolve, reject))) : 
        config.defaultLang;

    let initNote = null;

    if (lang === "ru") {
        initNote = {
            endTime: -1,
            finished: 0,
            notificate: 0,
            startTime: -1,
            tag: "#c5282f",
            title: "Привет",
            added: moment().startOf("day").valueOf(),
            dynamicFields: [
                {
                    type: "text",
                    value: "Это - пример того, как выглядит заметка в Ежедневнике. Нажмите на заметку что-бы увидеть полное содержание.\nЗаметка может содержать в себе:"
                },
                {
                    type: "listItem",
                    value: "Обычный текст",
                    checked: false
                },
                {
                    type: "listItem",
                    value: "Списки",
                    checked: false
                },
                {
                    type: "listItem",
                    value: "Цветовую метку",
                    checked: false
                },
                {
                    type: "listItem",
                    value: "Фото",
                    checked: false
                },
                {
                    type: "listItem",
                    value: "Напоминание",
                    checked: false
                },
                {
                    type: "text",
                    value: "Можно настроить автоматическое повторение заметок."
                },
                {
                    type: "text",
                    value: "Приятного пользования!"
                }
            ]            
        };
    } else {
        initNote = {
            endTime: -1,
            finished: 0,
            notificate: 0,
            startTime: -1,
            tag: "#c5282f",
            title: "Hello",
            added: moment().startOf("day").valueOf(),
            dynamicFields: [
                {
                    type: "text",
                    value: "This is an example of the note in the Diary. Tap on the note to look the full content.\nThe note might consist:"
                },
                {
                    type: "listItem",
                    value: "Default text",
                    checked: false
                },
                {
                    type: "listItem",
                    value: "Lists",
                    checked: false
                },
                {
                    type: "listItem",
                    value: "Color mark",
                    checked: false
                },
                {
                    type: "listItem",
                    value: "Photo",
                    checked: false
                },
                {
                    type: "listItem",
                    value: "A remind",
                    checked: false
                },
                {
                    type: "text",
                    value: "You can setup automatic repetition of notes ."
                },
                {
                    type: "text",
                    value: "Pleasant enjoyment!"
                }
            ]           
        }       
    }
console.log()
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
    ])
}