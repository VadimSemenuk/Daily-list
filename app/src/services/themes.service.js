import { randomInteger } from "../utils/randomNumber";

class ThemesService {
    themes = [
        {
            id: 0,
            header: '#00213C',
            body: '#fff',
            light: '#9bacb9'
        },
        {
            id: 1,
            header: '#F44336',
            body: '#fff',
            light: '#f79e97'
        },
        {
            id: 2,
            header: '#E91E63',
            body: '#fff',
            light: '#e092ac'
        },
        {
            id: 3,
            header: '#9C27B0',
            body: '#fff',
            light: '#d09ed8'
        },
        {
            id: 4,
            header: '#00BCD4',
            body: '#fff',
            light: '#8fd5de'
        },
        {
            id: 5,
            header: '#009688',
            body: '#fff',
            light: '#85c3be'
        },
        {
            id: 6,
            header: '#4CAF50',
            body: '#fff',
            light: '#9bca9d'
        },
        {
            id: 7,
            header: '#8BC34A',
            body: '#fff',
            light: '#b9d895'
        },
        {
            id: 8,
            header: '#CDDC39',
            body: '#fff',
            light: '#d5dc8a'
        },
        {
            id: 9,
            header: "#f57c00",
            body: '#fff',
            light: '#ecbb88'
        },
        {
            id: 10,
            header: '#795548',
            body: '#fff',
            light: '#c19889'
        },
        {
            id: 11,
            header: '#6c6c6c',
            body: '#fff',
            light: '#afafaf'
        },
        {
            id: 12,
            header: '#607D8B',
            body: '#fff',
            light: '#aabec7'
        },
        {
            id: 13,
            header: '#222222',
            body: '#fff',
            light: '#afafaf'
        },
        {
            id: 14,
            header: '#2b3b46',
            body: '#fff',
            light: '#9dbace'
        }
    ];

    getThemeById = (id) => {
        if (id === -2) {
            return {id: -2};
        }
        if (id === -1) {
            let theme = this.themes[randomInteger(0, this.getThemesCount() - 1)];
            return Object.assign({}, theme, {id: -1, realId: theme.id});
        }
        return this.themes.find((a) => a.id === id);
    };

    getThemesList = () => [...this.themes];

    getThemesCount = () => this.themes.length;

    applyTheme = (theme) => {
        if (theme.id === -2) {
            let styleEl = document.querySelector("style.theme-styles");
            if (styleEl) {
                styleEl.remove();
            }
            window.cordova && window.StatusBar.backgroundColorByHexString("#222");
            document.querySelector("body").classList.add("night-mode");
        } else {
            document.querySelector("body").classList.remove("night-mode");
            window.cordova && window.StatusBar.backgroundColorByHexString(theme.header);
            let styleEl = document.querySelector("style.theme-styles");
            if (!styleEl) {
                styleEl = document.createElement("style");
                styleEl.classList.add("theme-styles");
                document.querySelector("body").appendChild(styleEl);
            }

            styleEl.innerHTML = `
                .theme-header-background {
                    background: ${theme.header};
                }
                .theme-header-border {
                    border-color: ${theme.header};
                }
                .page-content {
                    background: ${theme.body}
                }
                .button.text.block {
                    background: ${theme.header};
                }
                .theme-tag {
                    background: ${theme.light};
                }
            `;
        }
    }
}

let themesService = new ThemesService();

export default themesService;