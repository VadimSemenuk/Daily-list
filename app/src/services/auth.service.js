import config from "../config/config";

import backupService from "./backup.service";

class AuthService {
    constructor() {
        this.token = JSON.parse(localStorage.getItem(config.LSTokenKey)) || {};
    }

    async signUp(user) {
        let token = await fetch(`${config.apiURL}/auth/sign-up`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })            
            .catch((err) => console.warn(err));

        this.setToken(token);

        return token;
    }

    async signIn(user) {
        let token = await fetch(`${config.apiURL}/auth/sign-in`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })            
            .catch((err) => console.warn(err));

        this.setToken(token);

        return token;
    }

    googleSignIn = async () => {
        let googleUser = await new Promise((resolve, reject) => {
            if (window.cordova) {
                window.plugins.googleplus.login(
                    {
                        scopes: 'https://www.googleapis.com/auth/drive.appfolder',
                        webClientId: config.google.webClientId,
                        offline: true
                    },
                    resolve,
                    reject
                );
            } else {
                resolve({
                    accessToken: "ya29.GlwuBhYQw0KLOAPQ3ZuM6RDaxZrvH-ZVhU6gbJubKYI-5mk68HcMODXOEeIBxLXaZp-f13_RIESvCT4OnHPhLjfmYU8yYLcel172cbohZuzyrEMTB_ZX-taBO5V8KQ",
                    displayName: "Вадим Семенюк",
                    email: "vadim54787@gmail.com",
                    expires: 1538854962,
                    expires_in: 2527,
                    familyName: "Семенюк",
                    givenName: "Вадим",
                    idToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjY0MWZjMDUzZWY2OGExNDdkNmUwODQ1YWI2OWI5ZDYxYWE0YmM3ODkifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIzOTAxNTI4MzY2MTItanE3MnIwdmxxZTd2NGFxaTh1c3FvaWdudHZzbGVxcWUuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIzOTAxNTI4MzY2MTItNXJjdWI2c3Zjb2ljbzVsdGVyZDE3aTZmb2czcGc5bGcuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDE3NDc3MjU5NjExMzg1OTEwMTQiLCJlbWFpbCI6InZhZGltNTQ3ODdAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiLQktCw0LTQuNC8INCh0LXQvNC10L3RjtC6IiwicGljdHVyZSI6Imh0dHBzOi8vbGg0Lmdvb2dsZXVzZXJjb250ZW50LmNvbS8tTlFmWUtGZ3VRbW8vQUFBQUFBQUFBQUkvQUFBQUFBQUFBQUEvQUFOMzFEV19zMWZqcjdCcmF6QVlEd3hZVzVVSEw0VjZXUS9zOTYtYy9waG90by5qcGciLCJnaXZlbl9uYW1lIjoi0JLQsNC00LjQvCIsImZhbWlseV9uYW1lIjoi0KHQtdC80LXQvdGO0LoiLCJsb2NhbGUiOiJydSIsImlhdCI6MTUzODg1MTM2NCwiZXhwIjoxNTM4ODU0OTY0fQ.PnJXsoCvvaTYMXF_LncrKX6cISttE_z1e96WFxOrErrsNn5dMEodOJgBybd1j6uIw5ifQOyBK5lYbxXYVuu8kyCPWJkLFAX6C-0l5uJ3yZ0_dUyNqIrhNs0nIH49pruVosdIN5QB10isCUe_JTRUFQxcSI-knfk7DXF2_LHRerWY-7HS5kT90VSAlJgFFlXYtOoBGggfXFRKmEpvYYHKcVZnwedZqbL-5zjWgLJHLbInuvvpKllRQo_6992XHO5bBV2XBV28YH094TprCjy3Vjl3KFTguFnRozbasLjfmy53PkL7fmBWxeQhOTI0TFikVM3qGCnnr4QgbbT63bW-xQ",
                    imageUrl: "https://lh4.googleusercontent.com/-NQfYKFguQmo/AAAAAAAAAAI/AAAAAAAAAAA/AAN31DW_s1fjr7BrazAYDwxYW5UHL4V6WQ/s96-c/photo.jpg",
                    userId: "101747725961138591014",
                    serverAuthCode: "4/cQDIFz_v7zaITvQERxHpZ_ByHSQD6fNknDZAJYXoVmQCpsd8Wixy2xp5-Ux-h8WD_l0Tu4EO4h8hgqhvGZTSyHg"
                })
            }
        });

        if (!window.cordova) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    let token = {
                        id: googleUser.userId,
                        email: googleUser.email,
                        name: googleUser.displayName,
                        picture: googleUser.imageUrl,
                        backupFile: {}
                    }
                    this.setToken(token);
        
                    resolve(token);
                }, 2000)
            })
        }

        let authUrl = "https://www.googleapis.com/oauth2/v4/token" + 
                `?code=${googleUser.serverAuthCode}` +
                `&client_id=${config.google.webClientId}` +
                `&client_secret=${config.google.webClientSecret}` +
                "&grant_type=authorization_code";

        let googleAccessToken = await fetch(authUrl, {
            method: "POST",
            credentials: "same-origin"
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })            
            .catch((err) => console.warn(err));

        let token = {
            id: googleUser.userId,
            email: googleUser.email,
            name: googleUser.displayName,
            picture: googleUser.imageUrl,
            token: "Bearer " + googleAccessToken.access_token,
            refreshToken: googleAccessToken.refresh_token,
            tokenExpireDate: +new Date() + 3400000,
            backupFile: {}
        }

        let backupFile = await backupService.getBackupFile(token);
        token.backupFile = backupFile;

        this.setToken(token);

        return token;
    }

    googleSignOut() {
        if (!window.cordova) {
            return Promise.resolve()
        }
        return new Promise((resolve) => window.plugins.googleplus.logout(() => {
            this.setToken({});
            console.log("logout done");
            resolve();
        }));
    }

    async googleRefreshAccessToken(token) {
        let authUrl = "https://www.googleapis.com/oauth2/v4/token" +
            `?refresh_token=${token.refreshToken}` +
            `&client_id=${config.google.webClientId}` +
            `&client_secret=${config.google.webClientSecret}` +
            "&grant_type=refresh_token";

        let googleAccessToken = await fetch(authUrl, {
            method: "POST",
            credentials: "same-origin"
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            })            
            .catch((err) => console.warn(err));

        let nextToken = {
            ...token,
            token: googleAccessToken,
            tokenExpireDate: +new Date() + 3400000
        }

        this.setToken(nextToken);

        return nextToken;
    }

    setToken(token) {
        localStorage.setItem(config.LSTokenKey, JSON.stringify(token));
        this.token = token;
    }

    getToken() {
        return this.token.token || "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNTMwMTM2NDQ1fQ.3QaBBwESmbCoRvuy6E6D4w4pv6GIw0I-tvkZlHJM5pQ";
    }

    getUserId() {
        return this.token.id || 1;
    }

    getUserInfoToken() {
        return this.token;
    }

    resetToken() {
        localStorage.removeItem(config.LSTokenKey);
        this.token = null;
    }
}

let authService = new AuthService();

export default authService;