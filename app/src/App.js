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
            loaderColor: null
        }
    }

    async componentWillMount() {
        window.cordova && await new Promise((resolve) => document.addEventListener("deviceready", resolve, false));
        store = await this.initApp();

        this.setState({
            appReady: true
        });

        deviceService.logLoad(this.state.deviceId);
        deviceService.logSaved();
    }

    async initApp() {
        await this.initDb()
            .catch(err => {
                deviceService.logError(err, {
                    path: "App.js/initDb"
                });
            });

        let meta = await deviceService.getMetaInfo();
        let settings = await settingsService.getSettings();
        this.applyInitSettings(settings);
        this.setState({
            loaderColor: settings.theme.header,
            deviceId: meta.deviceId
        });
        let password = !settings.password;
        let date = moment().startOf("day");
        let notes = await notesService.getNotesByDates([moment(date).add(-1, "day"), date, moment(date).add(1, "day")]);
        let user = authService.getToken();

        // await notesService.moveNotFinishedToToday();

        return initStore({settings, password, notes, date, user, meta});
    }

    async initDb() {
        window.com_mamindeveloper_dailylist_db = await DB();
        await migration.run();
    }

    applyInitSettings(settings) {
        document.querySelector("body").style.fontSize = settings.fontSize + "px";
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
                this.state.loaderColor ?
                (
                    <div className="init-loader-container">
                        <BeatLoader
                            color={this.state.loaderColor}
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