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

    get(path, queryParams) {
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
        })
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
        })
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
        })
    }

    async delete(path, body ) {
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
        })
    }
}

let apiService = new ApiService();

export default apiService;