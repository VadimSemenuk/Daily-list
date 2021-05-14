import moment from "moment";
import i18next from "i18next";
import {NoteRepeatType} from "../constants";

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
            sound: true,
            priority: 2
        };

        switch(note.repeatType) {
            case NoteRepeatType.NoRepeat: {
                let atDate = moment(note.date).hour(note.startTime.hour()).minute(note.startTime.minute());
                atDate = new Date(atDate.valueOf());
                notificationConfig.trigger = { at: atDate };
                notificationConfig.id = note.key;
                window.cordova.plugins.notification.local.schedule(notificationConfig);
                break;
            }
            case NoteRepeatType.Day: {
                notificationConfig.trigger = {
                    every: {
                        hour: note.startTime.hour(),
                        minute: note.startTime.minute()
                    },
                };
                notificationConfig.id = note.key;
                window.cordova.plugins.notification.local.schedule(notificationConfig);
                break;
            }
            case NoteRepeatType.Week: {
                let notificationConfigs = note.repeatDates.map((date) => {
                    return {
                        ...notificationConfig,
                        id: +`${note.key}${date}`,
                        trigger: {
                            every:
                                {
                                    weekday: date,
                                    hour: note.startTime.hour(),
                                    minute: note.startTime.minute()
                                },
                        },
                    }
                })
                window.cordova.plugins.notification.local.schedule(notificationConfigs);
                break;
            }
            case NoteRepeatType.Any: {
                let notificationConfigs = note.repeatDates.map((date) => {
                    let atDate = moment(date).startOf("day").hour(note.startTime.hour()).minute(note.startTime.minute());
                    atDate = new Date(atDate.valueOf());

                    return {
                        ...notificationConfig,
                        id: +`${note.key}${date}`,
                        trigger: { at: atDate }
                    }
                });
                window.cordova.plugins.notification.local.schedule(notificationConfigs);
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
        if (note.repeatType === NoteRepeatType.Any || note.repeatType === NoteRepeatType.Week) {
            ids = note.repeatDates.map((date) => +`${note.key}${date}`);
        }

        window.cordova.plugins.notification.local.cancel(ids);

        if (note.repeatType === NoteRepeatType.Any || note.repeatType === NoteRepeatType.Week) {
            this.clearOldVersionNotes(note);
        }
    };

    clearOldVersionNotes(note) {
        let ids = [note.key];

        if (note.repeatType === NoteRepeatType.Any) {
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

        return `${startTime}${(data.startTime && data.endTime) ? " - " : ""}${endTime}\n${data.contentItems[0] ? (data.contentItems[0].value.length > 50 ? data.contentItems[0].value.slice(0, 47) + '...' : data.contentItems[0].value) : ""}`
    }
}

let notificationService = new NotificationService();

export default notificationService;