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

    async refreshGTokenIfNeed() {
        let token = authService.getAuthorizationToken();
        if (!token || !token.google) {
            return;
        }
        if ((token.google.msTokenExpireDateUTC - 100) < moment.utc().valueOf()) {
            await authService.gRefreshAccessToken();
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

        let token = authService.getAuthorizationToken();
        if (token && token.api) {
            headers["Authorization"] = token.api.token;
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

        let token = authService.getAuthorizationToken();
        if (token && token.api) {
            headers["Authorization"] = token.api.token;
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

        let token = authService.getAuthorizationToken();
        if (token && token.api) {
            headers["Authorization"] = token.api.token;
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

        let token = authService.getAuthorizationToken();
        if (token && token.api) {
            headers["Authorization"] = token.api.token;
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
            await this.refreshGTokenIfNeed();
            let token = authService.getAuthorizationToken();
            if (token && token.google) {
                headers["Authorization"] = token.google.accessToken;
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
            await this.refreshGTokenIfNeed();
            let token = authService.getAuthorizationToken();
            if (token && token.google) {
                headers["Authorization"] = token.google.accessToken;
            }
        }

        return fetch(`https://www.googleapis.com/${path}${serializedQuery ? `?${serializedQuery}` : ''}`, {
            method: "GET",
            credentials: "same-origin",
            headers: headers
        });
    }

    async sendMail(props) {
        let body = new FormData();
        body.append("from", props.from + " <dailylist@sandboxdafa6483faba4421b8c92270835be699.mailgun.org>")
        body.append("to", props.to)
        body.append("subject", props.subject)
        body.append("text", props.text)

        return fetch("https://api.mailgun.net/v3/sandboxdafa6483faba4421b8c92270835be699.mailgun.org/messages", {
            method: "POST",
            body,
            headers: {
                Authorization: "Basic YXBpOjFhZmNjZWE4NzI0YTVhMzI3ZmVkZGFiNjg0Y2ExZWI4LWY2OTZiZWI0LTU2NTZjYjYx",
            }
        })
    }
}

let apiService = new ApiService();

export default apiService;