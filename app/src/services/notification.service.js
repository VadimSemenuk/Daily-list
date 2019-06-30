import moment from "moment";
import i18next from "i18next";

class NotificationService {
    set = async (note) => {
        if (!window.cordova) {
            return;
        }

        let hasPermission = await new Promise((resolve) => {
            window.cordova.plugins.notification.local.hasPermission((granted) => {
                if (!granted) {
                    window.cordova.plugins.notification.local.requestPermission(resolve);
                } else {
                    resolve(true);
                }
            });
        });

        if (!hasPermission) {
            window.plugins.toast.showLongBottom(i18next.t("error-notification-permission"));
        }

        let notificationConfig = {
            title: note.title || i18next.t("default-notification-title"),
            text: this.getMessage(note),
            sound: true
        };

        switch(note.repeatType) {
            case "no-repeat": {
                let atDate = moment(note.added).hour(note.startTime.hour()).minute(note.startTime.minute());
                atDate = new Date(atDate.valueOf());
                notificationConfig.trigger = { at: atDate };
                notificationConfig.id = note.key;
                window.cordova.plugins.notification.local.schedule(notificationConfig);
                break;
            }
            case "day": {
                notificationConfig.trigger = {
                    every: {
                        hour: note.startTime.hour(),
                        minute: note.startTime.minute()
                    },
                    count: 999
                };
                notificationConfig.id = note.key;
                window.cordova.plugins.notification.local.schedule(notificationConfig);
                break;
            }
            case "week": {
                note.repeatDates.forEach((date) => {
                    window.cordova.plugins.notification.local.schedule(
                        {
                            ...notificationConfig,
                            id: `${date}_${note.key}`,
                            trigger: {
                                every:
                                    {
                                        weekday: date,
                                        hour: note.startTime.hour(),
                                        minute: note.startTime.minute()
                                    },
                                count: 999
                            }
                        }
                    );
                });
                break;
            }
            case "any": {
                note.repeatDates.forEach((date) => {
                    let atDate = moment(date).startOf("day").hour(note.startTime.hour()).minute(note.startTime.minute());
                    atDate = new Date(atDate.valueOf());

                    window.cordova.plugins.notification.local.schedule({
                        ...notificationConfig,
                        id: `${date}_${note.key}`,
                        trigger: { at: atDate }
                    });
                });
                break;
            }
            default: break;
        }
    };

    clear = (note) => {
        if (!window.cordova) {
            return;
        }

        let ids = [note.key];
        if (note.repeatType === "any" || note.repeatType === "week") {
            ids = note.repeatDates.map((date) => `${date}_${note.key}`);
        }

        window.cordova.plugins.notification.local.cancel(ids);

        if (note.repeatType === "any" || note.repeatType === "week") {
            this.clearOldVersionNotes(note);
        }
    };

    clearOldVersionNotes(note) {
        let ids = [note.key];

        if (note.repeatType === "any") {
            ids = note.repeatDates;
        }

        window.cordova.plugins.notification.local.cancel(ids);
    }

    getMessage(data) {
        let startTime = "", 
            endTime = "";
        if (data.startTime) {
            startTime = data.startTime.format("HH:mm")
        }
        if (data.endTime) {
            endTime = data.endTime.format("HH:mm")
        }

        return `${startTime}${(data.startTime && data.endTime) ? " - " : ""}${endTime}\n${data.dynamicFields[0].value.length > 50 ? data.dynamicFields[0].value.slice(0, 47) + '...' : data.dynamicFields[0].value}`
    }
}

let notificationService = new NotificationService();

export default notificationService;