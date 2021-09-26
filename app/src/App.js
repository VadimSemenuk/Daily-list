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
import tagsService from "./services/tags.service";
import config from "./config/config";
import executeSQL from "./utils/executeSQL";

window.moment = moment;
window.executeSQL = executeSQL;

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

        let system = localStorage.getItem(config.LSSystemKey);
        if (!system) {
            system = this.initSystemData();
        }

        if (!system.isDayChangeEventSet) {
            setTimeout(() => {
                if (window.cordova) {
                    window.cordova.plugins.natives.scheduleDayChangeNotification();
                    this.setSystemData({...system, isDayChangeEventSet: true});
                }
            });
        }

        logsService.logLoad(window.device.uuid);
        if (deviceService.hasNetworkConnection()) {
            logsService.uploadSavedErrorLogs();
            logsService.uploadSavedLoadLogs();
        }

        notesService.removeDeletedNotes(moment().subtract(30, "day").startOf("day").valueOf());
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

        let tags = await tagsService.getTags();
        await tagsService.updateCache();

        let date = moment().startOf("day");

        let notes = await notesService.getNotes(settings.notesScreenMode, [moment(date).add(-1, "day").startOf("day"), moment(date), moment(date).add(1, "day").startOf("day")]);

        let user = authService.getUser();
        authService.initAuthorizationToken();

        backupService.setDatabasesDirectory();

        this.store = initStore({settings, password, notes, date, user, meta, tags});

        this.setState({isAppReady: true});
    }

    async initDb() {
        window.com_mamindeveloper_dailylist_db = await DB();
        await migration.run();
    }

    applyInitSettings(settings) {
        themesService.applyTheme(settings.theme);
        moment.locale(settings.lang);
        this.i18n = lang.init(settings.lang);
    }

    initSystemData() {
        let system = {isDayChangeEventSet: false};
        localStorage.setItem(config.LSSystemKey, JSON.stringify(system));
        return system;
    }

    setSystemData(system) {
        localStorage.setItem(config.LSSystemKey, JSON.stringify(system));
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