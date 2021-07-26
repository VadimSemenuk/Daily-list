import i18next from 'i18next';
import moment from 'moment';

import config from "../config/config";
import CustomError from "../common/CustomError";
import deviceService from "./device.service";
import apiService from "./api.service";

class AuthService {
    gAuthorizationToken = null;
    user = null;

    googleSignIn = async () => {
        if (!deviceService.hasNetworkConnection()) {
            throw new CustomError("no internet connection", i18next.t("internet-required"));
        }

        if (!window.cordova) {
            let user = {
                id: 1,
                email: "vadim54787@gmail.com",
                name: "Vadim",
                picture: "",
                gdBackup: {
                    backupFiles: []
                },
                settings: {
                    autoBackup: true
                }
            };

            this.setAuthorizationToken({
                google: {
                    accessToken: "Bearer ya29.a0ARrdaM86UH7LhFM2WbSl1g7W3JyosftaYVLhlsW6qIcufwGgdL3m9AVVqY_Ok2oNLZdw8ysCDhv0U_STHapJNoz8YleyRXkg4Io4AfeuVv9ktp5YStW1y6giF5MIIu8dLc0KaTxPkaD155kwWxnIB9acogvE",
                    refreshToken: "1//09fNvdTKlBczVCgYIARAAGAkSNwF-L9IrKwkWhojjYBRMoPg2ABZ-3AIzPw8AINaNaM8RKbZa4c2Jb3y0-ZKGcb0OWlw-C6QOcMY",
                    msTokenExpireDateUTC: 0,
                }
            });

            return this.getFormattedUser(user);
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

        let user = {
            id: googleUser.userId,
            email: googleUser.email,
            name: googleUser.displayName,
            picture: googleUser.imageUrl,
            gdBackup: {
                backupFiles: []
            },
            settings: {
                autoBackup: true
            }
        };

        this.setAuthorizationToken({
            google: {
                accessToken: "Bearer " + googleAccessToken.access_token,
                refreshToken: googleAccessToken.refresh_token,
                msTokenExpireDateUTC: moment.utc().valueOf() + 3400000,
            }
        });

        return this.getFormattedUser(user);
    };

    googleSignOut() {
        if (!window.cordova) {
            return Promise.resolve()
        }
        return new Promise((resolve) => window.plugins.googleplus.logout(resolve, resolve));
    }

    async gRefreshAccessToken() {
        let token = this.getAuthorizationToken().google;
        let authUrl = "oauth2/v4/token" +
            `?refresh_token=${token.refreshToken}` +
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

        this.setAuthorizationToken({
            google: {
                ...token,
                accessToken: "Bearer " + googleAccessToken.access_token,
                msTokenExpireDateUTC: moment.utc().valueOf() + 3400000,
            }
        });
    }

    setUser(user) {
        let tokenToSave = {
            ...user,
            gdBackup: {
                ...user.gdBackup,
                backupFiles: user.gdBackup.backupFiles.map((f) => ({
                    ...f,
                    modifiedTime: moment(f.modifiedTime).valueOf()
                }))
            }
        };
        localStorage.setItem(config.LSUserKey, JSON.stringify(tokenToSave));
        this.user = this.getFormattedUser(user);
    }

    getUser() {
        if (this.user) {
            return this.user;
        } else {
            let user = JSON.parse(localStorage.getItem(config.LSUserKey));
            return this.getFormattedUser(user);
        }
    }

    getFormattedUser(user) {
        if (!user) {
            return user;
        }
        let nextUser = {
            ...user,
            gdBackup: {
                ...user.gdBackup,
                backupFiles: user.gdBackup.backupFiles.map((f) => ({...f, modifiedTime: moment(f.modifiedTime)}))
            }
        };
        return nextUser;
    }

    resetUser() {
        localStorage.removeItem(config.LSUserKey);
        this.user = null;
        this.resetAuthorizationToken();
    }

    setAuthorizationToken(token) {
        let currentToken = this.getAuthorizationToken();
        this.gAuthorizationToken = {...currentToken, ...token};
        localStorage.setItem(config.LSTokenKey, JSON.stringify(this.gAuthorizationToken));
    }

    getAuthorizationToken() {
        if (this.gAuthorizationToken) {
            return this.gAuthorizationToken;
        } else {
            return JSON.parse(localStorage.getItem(config.LSTokenKey));
        }
    }

    resetAuthorizationToken() {
        this.gAuthorizationToken = null;
        localStorage.removeItem(config.LSTokenKey);
    }

    initAuthorizationToken() {
        this.gAuthorizationToken = this.getAuthorizationToken();
    }
}

let authService = new AuthService();

export default authService;