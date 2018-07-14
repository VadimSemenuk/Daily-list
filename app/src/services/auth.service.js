import config from "../config/config";

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
    }

    setToken(token) {
        localStorage.setItem(config.LSTokenKey, JSON.stringify(token));
        this.token = token;
    }

    getToken() {
        return this.token.token || "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNTMwMTM2NDQ1fQ.3QaBBwESmbCoRvuy6E6D4w4pv6GIw0I-tvkZlHJM5pQ";
    }

    getUserId() {
        return this.token.id || 3;
    }

    getUserInfoToken() {
        return this.token
    }

    resetToken() {
        localStorage.removeItem(config.LSTokenKey);
        this.token = null;
    }
}

let authService = new AuthService();

export default authService;