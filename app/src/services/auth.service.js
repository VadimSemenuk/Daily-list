import i18next from 'i18next';

import config from "../config/config";

class AuthService {
    googleSignIn = async () => {
        if (window.cordova ? navigator.connection.type === window.Connection.NONE : !navigator.onLine) {
            window.plugins.toast.showLongBottom(i18next.t("internet-required"));
            return {};
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
            }

            this.setToken(token);

            return 
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
        }).catch((err) => console.warn(err));
        if (!googleUser) {
            return {};
        }

        console.log(googleUser);
        console.log(JSON.stringify({
            idToken: googleUser.idToken
        }));

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
            })            
            .catch((err) => console.warn(err));
        if (!user) {
            window.plugins.toast.showLongBottom(i18next.t("error-repeat-common"));            
            return {};
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
        }

        this.setToken(token);

        return token;
    }

    googleSignOut() {
        if (!window.cordova) {
            return Promise.resolve()
        }
        return new Promise((resolve, reject) => window.plugins.googleplus.logout(() => {
            this.setToken({});
            resolve();
        }, (err) => {
            console.warn(err);
            resolve();
        }));
    }

    setToken(token) {
        localStorage.setItem(config.LSTokenKey, JSON.stringify(token));
    }

    getToken() {
        return JSON.parse(localStorage.getItem(config.LSTokenKey)) || {};
    }

    resetToken() {
        localStorage.removeItem(config.LSTokenKey);
    }
}

let authService = new AuthService();

export default authService;