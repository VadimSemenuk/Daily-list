import React, {Component} from "react";
import {Provider} from "react-redux";
import initStore from "./store";
import {BeatLoader} from 'react-spinners';
import {I18nextProvider} from "react-i18next";
import moment from "moment";
import 'moment/locale/ru';
import 'moment/locale/be';

import lang from "./i18n";

import Root from "./Root";

import DB from './db/db';
import migration from './db/migration/migration';
import settingsService from "./services/settings.service";
import themesService from "./services/themes.service";
import deviceService from "./services/device.service";
import notesService from "./services/notes.service";
import authService from "./services/auth.service";

let store = null;
let i18n = null;

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            appReady: false,
            loaderReady: false,
            loaderColor: null
        }
    }

    async componentWillMount() {
        window.cordova && await new Promise((resolve) => document.addEventListener("deviceready", resolve, false));
        store = await this.initApp()
            .catch((err) => {
                console.warn(err);
                return null
            });


        if (store) {
            this.setState({
                appReady: true
            });

            deviceService.logLoad();
        }
    }

    async initApp() {
        window.db = await this.initDb();   

        let settings = await settingsService.getSettings();
        this.applyInitSettings(settings);
        let password = !settings.password;
        let date = moment().startOf("day");
        let notes = await notesService.getNotesByDates(
            [moment(date).add(-1, "day"), date, moment(date).add(1, "day")], 
            settings.notesShowInterval
        );
        let meta = await deviceService.getMetaInfo();
        let user = authService.getToken();

        return initStore({settings, password, notes, date, user, meta});
    }

    async initDb() {
        window.db = await DB();
        await migration.run();
        return window.db;       
    }

    async initSettings() {
        let settings = await settingsService.getSettings();
        this.applyInitSettings(settings);
        this.setState({settings});

        return settings;
    }

    applyInitSettings(settings) {
        document.querySelector("body").style.fontSize = settings.fontSize + "px";
        window.cordova && window.StatusBar.backgroundColorByHexString(settings.theme.statusBar);
        themesService.applyTheme(settings.theme);
        moment.locale(settings.lang);
        i18n = lang.init(settings.lang);
    }

    render() {
        return (
            this.state.appReady ?
            (
                <Provider store={store}>
                    <I18nextProvider i18n={i18n}>
                        <Root />
                    </I18nextProvider>
                </Provider>
            )
            :
            (
                this.state.settings ?
                (
                    <div className="init-loader-container">
                        <BeatLoader
                            color={this.state.settings.theme.header}
                            loading={true} 
                        />
                    </div>
                )
                :
                (
                    <div>Loading settings</div>
                )
            )
        );
    }
}