import executeSQL from '../utils/executeSQL';
import themesService from './themes.service';

let sortTypeSettings = [{
    translateId: "time-sort",
    val: 0
}, {
    translateId: "time-add-sort",
    val: 1
}];

let sortDirectionSettings = [{
    translateId: "view-direction-asc",
    val: 0
}, {
    translateId: "view-direction-desc",
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
}];

class SetitngsService {

    getSortTypeSettings() {
        return [...sortTypeSettings]
    }

    getSortDirectionSettings() {
        return [...sortDirectionSettings]
    }

    getFontSizeSettings() {
        return [...fontSizeSettings]
    }

    getNotesShowIntervalSettings() {
        return [...notesShowIntervalSettings]
    }

    getLanguageSettings() {
        return [...languageSettings]
    }

    async getSettings () {
        try {
            let select = await executeSQL(
                `SELECT defaultNotification, sort, fastAdd, theme, password, fontSize, showMiniCalendar, notesShowInterval, lang
                FROM Settings;`
            );

            let result = select.rows.item(0);

            return {
                ...result, 
                defaultNotification: Boolean(result.defaultNotification),
                fastAdd: Boolean(result.fastAdd),
                theme: themesService.getThemeById(result.theme),
                sort: JSON.parse(result.sort),
                showMiniCalendar: Boolean(result.showMiniCalendar)
            }
        } catch (err) {
            console.log('Error: ', err);
        }
    }

    async setSetting (item, value) {
        switch(item) {
            case("theme"): value = value.id; break;
            case("sort"): value = JSON.stringify(value); break;
            default: break;
        }
        try {
            await executeSQL(
                `UPDATE Settings 
                SET ${item} = ?;`, [value]
            );
        } catch (err) {
            console.log('Error: ', err);
        }
    }
}

let setitngsService = new SetitngsService();

export default setitngsService;