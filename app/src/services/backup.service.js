import config from "../config/config";

class BackupService {
    constructor() {
        this.token = JSON.parse(localStorage.getItem(config.LSTokenKey)) || {};
    }

    async uploadBackup(user) {
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
}

let backupService = new BackupService();

export default backupService;