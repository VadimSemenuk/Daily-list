import i18next from 'i18next';

import config from "../config/config";
import CustomError from "../common/CustomError";

class AuthService {
    googleSignIn = async () => {
        if (window.cordova ? navigator.connection.type === window.Connection.NONE : !navigator.onLine) {
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
        // check error structure
        if (!googleUser) {
            throw new Error("user not found");
        }

        let user = await fetch(`${config.apiURL}/auth/sign-in-google`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                idToken: googleUser.idToken
            })
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            });

        if (!user) {
            // window.plugins.toast.showLongBottom(i18next.t("error-repeat-common"));
            // return null;
            throw new Error("user not found");
        }

        let token = {
            id: googleUser.userId,
            email: googleUser.email,
            name: googleUser.displayName,
            picture: googleUser.imageUrl,
            token: "Bearer " + user.token,
            backup: {
                lastBackupTime: null,
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
        token.backup.lastBackupTime = token.backup.lastBackupTime !== null ? token.backup.lastBackupTime.valueOf() : null;
        localStorage.setItem(config.LSTokenKey, JSON.stringify(token));
    }

    getToken() {
        let token = JSON.parse(localStorage.getItem(config.LSTokenKey)) || {};
        token.backup.lastBackupTime = token.backup.lastBackupTime !== null ? moment(token.backup.lastBackupTime) : null;
    }

    resetToken() {
        localStorage.removeItem(config.LSTokenKey);
    }
}

let authService = new AuthService();

export default authService;