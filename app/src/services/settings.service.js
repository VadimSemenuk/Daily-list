import executeSQL from '../utils/executeSQL';
import themesService from './themes.service';
import {SortDirectionType, SortType} from "../constants";

let sortTypeSettings = [{
    translateId: "time-sort",
    val: SortType.TimeSort
}, {
    translateId: "time-add-sort",
    val: SortType.TimeAddSort
}, {
    translateId: "custom-sort",
    val: SortType.CustomSort
}];

let sortDirectionSettings = [{
    translateId: "view-direction-desc",
    val: SortDirectionType.DESC
}, {
    translateId: "view-direction-asc",
    val: SortDirectionType.ASC
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
                theme, 
                password, 
                fontSize, 
                notesShowInterval, 
                lang,
                calendarNotesCounterMode,
                sortType,
                sortDirection,
                sortFinBehaviour,
                minimizeNotes,
                calendarMode,
                notesScreenMode,
                passwordResetEmail
            FROM Settings;`
        );

        let result = select.rows.item(0);

        return {
            ...result,
            defaultNotification: Boolean(result.defaultNotification),
            theme: themesService.getThemeById(result.theme),
            minimizeNotes: Boolean(result.minimizeNotes)
        };
    }

    async setSetting (item, value) {
        switch(item) {
            case("defaultNotification"): value = Number(value); break;
            case("theme"): value = value.id; break;
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