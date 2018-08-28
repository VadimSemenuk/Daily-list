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

    async getSettings () {
        try {
            let select = await executeSQL(
                `SELECT settings
                FROM Settings;`
            );
            console.log(select);

            let result = JSON.parse(select.rows.item(0).settings);

            return {
                ...result,
                theme: themesService.getThemeById(result.theme),
            }
        } catch (err) {
            console.log('Error: ', err);
        }
    }

    async setSettings (settingName, value, settings) {  
        settings[settingName] = value;
        settings.theme = settings.theme.id;

        try {
            await executeSQL(
                `UPDATE Settings 
                SET settings = ?;`, [JSON.stringify(settings)]
            );
        } catch (err) {
            console.log('Error: ', err);
        }
    }
}

let setitngsService = new SetitngsService();

export default setitngsService;