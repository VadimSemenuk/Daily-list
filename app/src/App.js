import React, {Component} from "react";
import {Provider} from "react-redux";
import initStore from "./store";
import {BeatLoader} from 'react-spinners';
import {I18nextProvider} from "react-i18next";

import i18n from "./i18n";

import Root from "./Root";

import DB from './db/db';
import migrationService from './services/migration/migration.service';
import settingsService from "./services/settings.service";
import themesService from "./services/themes.service";

let store;

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            appReady: false,
            settings: null
        }
    }

    componentWillMount() {
        this.initApp();
    }

    async initApp() {
        if (window.cordova) {
            await new Promise((resolve) => document.addEventListener("deviceready", resolve, false));
        }

        await this.initDb();       
        await this.initSettings();
        window.DEVICE_IMEI = "1";
        store = await initStore(this.state.settings);
        this.setState({
            appReady: true
        });
    }

    async initDb() {
        window.db = await DB();
        await migrationService.run();       
    }

    async initSettings() {
        let settings = await settingsService.getSettings();
        this.applyInitSettings(settings);
        await this.setState({settings});
    }

    applyInitSettings(settings) {
        document.querySelector("body").style.fontSize = settings.fontSize + "px";
        if (window.cordova && window.cordova.platformId === 'android') {
            window.StatusBar.backgroundColorByHexString(settings.theme.statusBar);
        }
        themesService.applyTheme(settings.theme);
    }

    render() {
        return (
            this.state.appReady ?
            <Provider store={store}>
                <I18nextProvider i18n={i18n}>
                    <Root />
                </I18nextProvider>
            </Provider>
            :
            this.state.settings ?
            <div className="init-loader-container">
                <BeatLoader
                    color={this.state.settings.theme.header}
                    loading={true} 
                />
            </div>
            :
            <div></div>
        );
    }
}