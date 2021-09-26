import executeSQL from '../utils/executeSQL';
import themesService from './themes.service';
import {SortDirectionType, SortType} from "../constants";

let sortTypeSettings = [{
    translateId: "time-sort",
    val: SortType.TimeSort
}, {
    translateId: "time-add-sort",
    val: SortType.TimeAddSort
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

    async getSettings() {
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
                passwordResetEmail,
                invertHeaderPosition,
                noteFilters,
                isQuickAddPanelVisible,
                autoMoveNotFinishedNotes
            FROM Settings;`
        );

        let result = select.rows.item(0);

        return {
            ...result,
            defaultNotification: Boolean(result.defaultNotification),
            theme: themesService.getThemeById(result.theme),
            minimizeNotes: Boolean(result.minimizeNotes),
            invertHeaderPosition: Boolean(result.invertHeaderPosition),
            noteFilters: JSON.parse(result.noteFilters),
            isQuickAddPanelVisible: Boolean(result.isQuickAddPanelVisible),
            autoMoveNotFinishedNotes: Boolean(result.autoMoveNotFinishedNotes)
        };
    }

    async setSetting(nextSettings) {
        let nextSettingsFormatted = Object.keys(nextSettings).map((name) => {
            let value = nextSettings[name];

            switch(name) {
                case("defaultNotification"): value = Number(value); break;
                case("theme"): value = value.id; break;
                case("minimizeNotes"): value = Number(value); break;
                case("invertHeaderPosition"): value = Number(value); break;
                case("noteFilters"): value = JSON.stringify(value); break;
                case("isQuickAddPanelVisible"): value = Number(value); break;
                case("autoMoveNotFinishedNotes"): value = Number(value); break;
                default: break;
            }

            return {name, value};
        });

        return executeSQL(
            `UPDATE Settings
            SET ${nextSettingsFormatted.map((setting) => `${setting.name} = ?`).join(",")};`,
            nextSettingsFormatted.map((setting) => setting.value)
        );
    }

    async deleteFilterTag(id) {
        let settings = await this.getSettings();

        let nextNoteFilters = {
            ...settings.noteFilters,
            tags: settings.noteFilters.tags.filter((_id) => _id !== id)
        };

        await this.setSetting({noteFilters: nextNoteFilters});

        return nextNoteFilters;
    }
}

let settingsService = new SettingsService();

export default settingsService;