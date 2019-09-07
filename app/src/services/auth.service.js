import i18next from 'i18next';
import moment from 'moment';

import config from "../config/config";
import CustomError from "../common/CustomError";
import deviceService from "./device.service";
import backupService from "./backup.service";
import apiService from "./api.service";

class AuthService {
    token = null;

    googleSignIn = async () => {
        if (!deviceService.hasNetworkConnection()) {
            throw new CustomError("no internet connection", i18next.t("internet-required"));
        }

        if (!window.cordova) {
            let token = {
                id: 1,
                email: "vadim54787@gmail.com",
                name: "Vadim",
                picture: "",
                gAccessToken: "Bearer ya29.GltvB00g8gh8FZ2CtFkaVz5SzrSp5yTUYmu5vtn3aJv0SO_U3741Mw4tz2TkmIq9jhMzFPbKLWldjOrYydN5JkfbCL7AXIkRsXxnwdSMV95PLDXMqwGyDyazxgvH",
                gRefreshToken: "1/0jjXAph4OlyluEkvVv0VA0e1KlQ0jdGpgld0HnjTviU",
                msGTokenExpireDateUTC: 0,
                gdBackup: {
                    backupFiles: []
                },
                localBackup: {
                    backupFiles: []
                },
                settings: {
                    autoBackup: true
                }
            };

            this.setToken(token);

            token.gdBackup.backupFiles = await backupService.getGDBackupFiles(token);
            this.setToken(token);

            return this.getToken();
        }

        let googleUser = await new Promise((resolve, reject) => {
            window.plugins.googleplus.login(
                {
                    scopes: 'https://www.googleapis.com/auth/drive.appfolder',
                    webClientId: config.google.webClientId,
                    offline: true
                },
                resolve,
                reject
            );
        });
        if (!googleUser) {
            throw new Error("user not found");
        }

        let authUrl = "oauth2/v4/token" +
            `?code=${googleUser.serverAuthCode}` +
            `&client_id=${config.google.webClientId}` +
            `&client_secret=${config.google.webClientSecret}` +
            "&grant_type=authorization_code";
        let googleAccessToken = await apiService.googleApiPost(authUrl, null, false)
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            });
        if (!googleAccessToken) {
            throw new Error();
        }

        let token = {
            id: googleUser.userId,
            email: googleUser.email,
            name: googleUser.displayName,
            picture: googleUser.imageUrl,
            gAccessToken: "Bearer " + googleAccessToken.access_token,
            gRefreshToken: googleAccessToken.refresh_token,
            msGTokenExpireDateUTC: moment.utc().valueOf() + 3400000,
            gdBackup: {
                backupFiles: []
            },
            settings: {
                autoBackup: true
            }
        };

        this.setToken(token);

        token.gdBackup.backupFiles = await backupService.getGDBackupFiles(token);
        this.setToken(token);

        return this.getToken();
    };

    googleSignOut() {
        if (!window.cordova) {
            return Promise.resolve()
        }
        return new Promise((resolve, reject) => window.plugins.googleplus.logout(() => {
            this.setToken(null);
            resolve();
        }, () => {
            resolve();
        }));
    }

    async googleRefreshAccessToken() {
        let user = this.getToken();
        let authUrl = "oauth2/v4/token" +
            `?refresh_token=${user.gRefreshToken}` +
            `&client_id=${config.google.webClientId}` +
            `&client_secret=${config.google.webClientSecret}` +
            "&grant_type=refresh_token";
        let googleAccessToken = await apiService.googleApiPost(authUrl, null, false)
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
                return false;
            });
        if (!googleAccessToken) {
            throw new Error();
        }

        let nextToken = {
            ...this.getToken(),
            gAccessToken: "Bearer " + googleAccessToken.access_token,
            msGTokenExpireDateUTC: moment.utc().valueOf() + 3400000,
        };

        this.setToken(nextToken);

        return nextToken;
    }

    setToken(token) {
        if (!token) {
            localStorage.removeItem(config.LSTokenKey);
            this.token = null;
        } else {
            let tokenToSave = {
                ...token,
                gdBackup: {
                    ...token.gdBackup,
                    backupFiles: token.gdBackup.backupFiles.map((f) => ({...f, modifiedTime: moment(f.modifiedTime).valueOf()}))
                }
            };
            localStorage.setItem(config.LSTokenKey, JSON.stringify(tokenToSave));
            this.token = this.getFormattedToken(token);
        }
    }

    getToken() {
        if (this.token) {
            return this.token;
        } else {
            let token = JSON.parse(localStorage.getItem(config.LSTokenKey));
            return this.getFormattedToken(token);
        }
    }

    getFormattedToken(token) {
        if (!token) {
            return token;
        }
        let nextToken = {
            ...token,
            gdBackup: {
                ...token.gdBackup,
                backupFiles: token.gdBackup.backupFiles.map((f) => ({...f, modifiedTime: moment(f.modifiedTime)}))
            }
        };
        return nextToken;
    }

    resetToken() {
        localStorage.removeItem(config.LSTokenKey);
        this.token = null;
    }
}

let authService = new AuthService();

export default authService;