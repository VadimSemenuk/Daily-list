import * as React from "react";
import {Provider} from "react-redux";
import initStore from "./store";
import 'moment/locale/ru';
import { BeatLoader } from 'react-spinners';

import Root from "./Root";

import DB from './db/db';
import appService from './services/app.service';
import settingsService from "./services/settings.service";

let store: any;

declare global {
    interface Window { 
        cordova: any;
        DEVICE_IMEI: any;
        db: any;
        StatusBar: any;
    }
}

type AppState = {
    appReady: boolean;
    settings: any;
}

export default class App extends React.Component<{}, AppState> {
    constructor(props: any) {
        super(props);

        this.state = {
            appReady: false,
            settings: null
        }
    }

    public componentWillMount() {
        this.initApp();
    }

    private async initApp() {
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

    private async initDB() {
        window.db = await DB();
        await appService.createDB();
    }

    private async initSettings() {
        let settings = await settingsService.getSettings();
        this.setState({settings});

        (document.querySelector("body") as HTMLElement).style.fontSize = settings.fontSize + "px";
        if (window.cordova && window.cordova.platformId === 'android') {
            window.StatusBar.backgroundColorByHexString(settings.theme.statusBar);
        }
    }

    public render() {
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
            <div/>
        );
    }
}