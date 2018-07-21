import React, {Component} from "react";
import {Provider} from "react-redux";
import initStore from "./store";
import 'moment/locale/ru';
import { BeatLoader } from 'react-spinners';

import Root from "./Root";

import DB from './db/db';
import appService from './services/app.service';
import settingsService from "./services/settings.service";

let store;

export default class App extends Component {
    constructor() {
        super();

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

        await this.initDB();
        await this.initSettings();
        window.DEVICE_IMEI = await appService.getDeviceIMEI();
        store = await initStore();
        this.setState({
            appReady: true
		});
    }

    async initDB() {
        window.db = await DB();
        await appService.createDB();
    }

    async initSettings() {
        let settings = await settingsService.getSettings();
        this.setState({settings});
    }

    applyInitSettings(settings) {
        document.querySelector("body").style.fontSize = settings.fontSize + "px";
        if (window.cordova && window.cordova.platformId === 'android') {
            window.StatusBar.backgroundColorByHexString(settings.theme.statusBar);
        }
    }

    render() {
        return (
            this.state.appReady ?
            <Provider store={store}>
                <Root />
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