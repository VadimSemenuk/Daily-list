import React, {Component} from "react";
import {Provider} from "react-redux";
import initStore from "./store";
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
import logsService from "./services/logs.service";
import backupService from "./services/backup.service";

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isAppReady: false
        }

        this.store = null;
        this.i18n = null;

        if (!window.cordova) {
            window.device = {uuid: 0};
        }
    }

    async componentWillMount() {
        window.cordova && await new Promise((resolve) => document.addEventListener("deviceready", resolve));
        await this.initApp();

        setTimeout(() => window.cordova && navigator.splashscreen.hide());

        logsService.logLoad(window.device.uuid);
        if (deviceService.hasNetworkConnection()) {
            logsService.uploadSavedErrorLogs();
            logsService.uploadSavedLoadLogs();
        }

        notesService.removeDeletedNotes(moment().subtract(30, "day").valueOf());
    }

    async initApp() {
        await this.initDb()
            .catch(err => {
                logsService.logError(err, {
                    path: "App.js/initDb"
                },  window.device.uuid);
            });

        let meta = await deviceService.getMetaInfo();
        let settings = await settingsService.getSettings();
        this.applyInitSettings(settings);

        let password = !settings.password;
        let date = moment().startOf("day");
        let notes = await notesService.getNotes(settings.notesScreenMode, [moment(date).add(-1, "day"), moment(date), moment(date).add(1, "day")]);
        let user = authService.getUser();
        authService.initAuthorizationToken();
        backupService.setDatabasesDirectory();
        this.store = initStore({settings, password, notes, date, user, meta});

        this.setState({isAppReady: true});
    }

    async initDb() {
        window.com_mamindeveloper_dailylist_db = await DB();
        await migration.run();
    }

    applyInitSettings(settings) {
        document.querySelector("body").style.fontSize = settings.fontSize + "px";
        themesService.applyTheme(settings.theme);
        moment.locale(settings.lang);
        this.i18n = lang.init(settings.lang);
    }

    render() {
        return (
            this.state.isAppReady &&
            <Provider store={this.store}>
                <I18nextProvider i18n={this.i18n}>
                    <Root />
                </I18nextProvider>
            </Provider>
        );
    }
}