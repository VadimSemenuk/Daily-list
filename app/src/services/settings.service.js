import executeSQL from '../utils/executeSQL';
import themesService from './themes.service';

class SetitngsService {
    async getSettings () {
        try {
            let select = await executeSQL(
                `SELECT defaultNotification, sort, fastAdd, theme, password, fontSize
                FROM Settings;`
            );

            let result = select.rows.item(0);

            return {
                ...result, 
                defaultNotification: !!result.defaultNotification,
                fastAdd: !!result.fastAdd,
                theme: themesService.getThemeById(result.theme),
                sort: JSON.parse(result.sort)
            }
        } catch (err) {
            console.log('Error: ', err);
        }
    }

    async setSetting (item, value) {  
        if (item === "theme") {
            value = value.id
            item = "colorTheme";
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