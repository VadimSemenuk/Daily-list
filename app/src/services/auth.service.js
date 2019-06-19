import i18next from 'i18next';
import moment from 'moment';

import config from "../config/config";
import CustomError from "../common/CustomError";
import apiService from "./api.service";
import deviceService from "./device.service";

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
                token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNTQxOTY5OTkzfQ.HPgRP7wjr-cN8d-U6PKsA-8r4ehuFgyBmOpE3hSYrEY",
                backup: {
                    lastBackupTime: null,
                },
                settings: {
                    autoBackup: false
                }
            };

            this.setToken(token);

            return token;
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

        let user = await apiService.post("auth/sign-in-google", {idToken: googleUser.idToken})
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            });

        if (!user) {
            throw new Error("user not found");
        }

        let token = {
            id: googleUser.userId,
            email: googleUser.email,
            name: googleUser.displayName,
            picture: googleUser.imageUrl,
            token: "Bearer " + user.token,
            backup: {
                lastBackupTime: user.lastBackupTime !== null ? moment(user.lastBackupTime) : null,
            },
            settings: {
                autoBackup: false
            }
        };

        this.setToken(token);

        return token;
    };

    googleSignOut() {
        if (!window.cordova) {
            return Promise.resolve()
        }
        return new Promise((resolve, reject) => window.plugins.googleplus.logout(() => {
            this.setToken({});
            resolve();
        }, () => {
            resolve();
        }));
    }

    setToken(token) {
        let nextToken = null;
        if (token) {
            nextToken = {
                ...token,
                backup: {
                    ...token.backup,
                    lastBackupTime: token.backup.lastBackupTime !== null ? token.backup.lastBackupTime.valueOf() : null
                }
            };
        }
        localStorage.setItem(config.LSTokenKey, JSON.stringify(nextToken));
        this.token = token;
    }

    getToken() {
        if (this.token) {
            return this.token
        } else {
            let token = JSON.parse(localStorage.getItem(config.LSTokenKey));
            if (token !== null) {
                token.backup.lastBackupTime = token.backup.lastBackupTime !== null ? moment(token.backup.lastBackupTime) : null;
            }
            return token;
        }
    }

    resetToken() {
        localStorage.removeItem(config.LSTokenKey);
        this.token = null;
    }
}

let authService = new AuthService();

export default authService;