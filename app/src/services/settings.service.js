import executeSQL from '../utils/executeSQL';
import themesService from './themes.service';

let sortTypeSettings = [{
    translateId: "time-sort",
    val: 0
}, {
    translateId: "time-add-sort",
    val: 1
}, {
    translateId: "custom-sort",
    val: 2
}];

let sortDirectionSettings = [{
    translateId: "view-direction-desc",
    val: 0
}, {
    translateId: "view-direction-asc",
    val: 1
}];

let fontSizeSettings = [12, 13, 14, 15, 16, 17, 18];

let notesShowIntervalSettings = [{
    translateId: "notes-show-interval-week",
    val: 0
}, {
    translateId: "notes-show-interval-day",
    val: 1
}];

let languageSettings = [{
    translateId: "ru",
    val: "ru"
}, {
    translateId: "en",
    val: "en"
}, {
    translateId: "be",
    val: "be"
}];

class SettingsService {
    getSortTypeSettings() {
        return [...sortTypeSettings];
    }

    getSortDirectionSettings() {
        return [...sortDirectionSettings];
    }

    getFontSizeSettings() {
        return [...fontSizeSettings];
    }

    getNotesShowIntervalSettings() {
        return [...notesShowIntervalSettings];
    }

    getLanguageSettings() {
        return [...languageSettings];
    }

    async getSettings () {
        let select = await executeSQL(
            `SELECT 
                defaultNotification, 
                fastAdd, 
                theme, 
                password, 
                fontSize, 
                notesShowInterval, 
                lang,
                calendarNotesCounter,
                calendarNotesCounterIncludeFinished,
                sortType,
                sortDirection,
                sortFinBehaviour,
                minimizeNotes,
                calendarMode,
                sortIncludePriority,
                notesScreenMode
            FROM Settings;`
        );

        let result = select.rows.item(0);

        return {
            ...result,
            defaultNotification: Boolean(result.defaultNotification),
            fastAdd: Boolean(result.fastAdd),
            theme: themesService.getThemeById(result.theme),
            calendarNotesCounter: Boolean(result.calendarNotesCounter),
            calendarNotesCounterIncludeFinished: Boolean(result.calendarNotesCounterIncludeFinished),
            sortIncludePriority: Boolean(result.sortIncludePriority),
            minimizeNotes: Boolean(result.minimizeNotes)
        };
    }

    async setSetting (item, value) {
        switch(item) {
            case("defaultNotification"): value = Number(value); break;
            case("fastAdd"): value = Number(value); break;
            case("theme"): value = value.id; break;
            case("calendarNotesCounter"): value = Number(value); break;
            case("calendarNotesCounterIncludeFinished"): value = Number(value); break;
            case("sortIncludePriority"): value = Number(value); break;
            case("minimizeNotes"): value = Number(value); break;
            default: break;
        }

        return executeSQL(
            `UPDATE Settings 
            SET ${item} = ?;`, [value]
        );
    }
}

let settingsService = new SettingsService();

export default settingsService;