import { randomInteger } from "../utils/randomNumber";

class ThemesService {
    colors = [
        // #2b3b46
        {
            id: 0,
            statusBar: '#030823',
            header: '#00213C',
            body: '#fff',
            light: "#183d5a"
        },
        {
            id: 1,
            statusBar: '#B71C1C',        
            header: '#F44336',
            body: '#fff',
            light: "#f15c51"            
        },
        {
            id: 2,
            statusBar: '#AD1457',
            header: '#E91E63',
            body: '#fff',
            light: "#ea4d82"
        },
        {
            id: 3,
            statusBar: '#6A1B9A',
            header: '#9C27B0',
            body: '#fff',
            light: '#bd40d2'
        },
        {
            id: 4,
            statusBar: '#0097A7',
            header: '#00BCD4',
            body: '#fff'
        },
        {
            id: 5,
            statusBar: '#00695C',
            header: '#009688',
            body: '#fff'
        },
        {
            id: 6,
            statusBar: '#2E7D32',
            header: '#4CAF50',
            body: '#fff'
        },
        {
            id: 7,
            statusBar: '#558B2F',
            header: '#8BC34A',
            body: '#fff'
        },
        {
            id: 8,
            statusBar: '#AFB42B',
            header: '#CDDC39',
            body: '#fff'
        },
        {
            id: 9,
            statusBar: '#bb4d00',
            header: "#f57c00",
            body: '#fff'
        },
        {
            id: 10,
            statusBar: '#4E342E',
            header: '#795548',
            body: '#fff'
        },
        {
            id: 11,
            statusBar: '#424242',
            header: '#9E9E9E',
            body: '#fff'
        },
        {
            id: 12,
            statusBar: '#37474F',
            header: '#607D8B',
            body: '#fff'
        },
        {
            id: 13,
            statusBar: '#000000',
            header: '#222222',
            body: '#fff'
        }
    ];

    getThemeByIndex = (index) => {
        if (index === -1) {
            index = randomInteger(0, this.getThemesCount() - 1)
        };
        return this.colors[index]
    }

    getThemesList = () => this.colors;

    getThemesCount = () => this.colors.length
}

let themesService = new ThemesService();

export default themesService;