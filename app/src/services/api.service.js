import moment from 'moment';
import config from "../config/config";
import authService from "./auth.service";

class ApiService {
    serializeQuery(obj) {
        let str = [];
        for (let p in obj) {
            if (obj.hasOwnProperty(p)) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
        }
        return str.join("&");
    }

    async refreshTokenIfNeed() {
        let user = authService.getToken();
        if (!user) {
            return;
        }
        if ((user.msGTokenExpireDateUTC - 100) < moment.utc().valueOf()) {
            await authService.googleRefreshAccessToken();
        }
    }

    async get(path, queryParams) {
        let serializedQuery = null;
        if (queryParams) {
            serializedQuery = this.serializeQuery(queryParams);
        }

        let headers = {
            "Content-Type": "application/json"
        };

        let user = authService.getToken();
        if (user) {
            headers["Authorization"] = user.token;
        }

        return fetch(`${config.apiURL}/${path}${serializedQuery ? `?${serializedQuery}` : ''}`, {
            method: "GET",
            credentials: "same-origin",
            headers: headers
        });
    }

    async post(path, body) {
        if (typeof body === "object") {
            body = JSON.stringify(body);
        }

        let headers = {
            "Content-Type": "application/json"
        };

        let user = authService.getToken();
        if (user) {
            headers["Authorization"] = user.token;
        }

        return fetch(`${config.apiURL}/${path}`, {
            method: "POST",
            credentials: "same-origin",
            headers: headers,
            body: body
        });
    }

    async put(path, body) {
        if (typeof body === "object") {
            body = JSON.stringify(body);
        }

        let headers = {
            "Content-Type": "application/json"
        };

        let user = authService.getToken();
        if (user) {
            headers["Authorization"] = user.token;
        }

        return fetch(`${config.apiURL}/${path}`, {
            method: "PUT",
            credentials: "same-origin",
            headers: headers,
            body: body
        });
    }

    async delete(path, body) {
        if (typeof body === "object") {
            body = JSON.stringify(body);
        }

        let headers = {
            "Content-Type": "application/json"
        };

        let user = authService.getToken();
        if (user) {
            headers["Authorization"] = user.token;
        }

        return fetch(`${config.apiURL}/${path}`, {
            method: "DELETE",
            credentials: "same-origin",
            headers: headers,
            body: body
        });
    }

    async googleApiPost(path, body, authorization = true) {
        if (typeof body === "object" && body !== null) {
            body = JSON.stringify(body);
        }

        let headers = {
            "Content-Type": "application/json"
        };

        if (authorization) {
            await this.refreshTokenIfNeed();
            let user = authService.getToken();
            if (user) {
                headers["Authorization"] = user.gAccessToken;
            }
        }

        let reqParams = {
            method: "POST",
            credentials: "same-origin",
            headers: headers,
        };
        if (body) {
            reqParams.body = body;
        }
        return fetch(`https://www.googleapis.com/${path}`, reqParams);
    }

    async googleApiGet(path, queryParams, authorization = true) {
        let serializedQuery = null;
        if (queryParams) {
            serializedQuery = this.serializeQuery(queryParams);
        }

        let headers = {
            "Content-Type": "application/json"
        };

        if (authorization) {
            await this.refreshTokenIfNeed();
            let user = authService.getToken();
            if (user) {
                headers["Authorization"] = user.gAccessToken;
            }
        }

        return fetch(`https://www.googleapis.com/${path}${serializedQuery ? `?${serializedQuery}` : ''}`, {
            method: "GET",
            credentials: "same-origin",
            headers: headers
        });
    }
}

let apiService = new ApiService();

export default apiService;