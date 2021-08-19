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
            priority: 2,
            smallIcon: 'res://notification',
        };

        switch(note.repeatType) {
            case NoteRepeatType.NoRepeat: {
                let atDate = moment(note.date).startOf("day").hour(note.startTime.hour()).minute(note.startTime.minute());
                let now = moment().startOf("minute");

                if (atDate.isBefore(now)) {
                    return;
                }

                notificationConfig.trigger = {
                    id: note.id
                };

                if (!atDate.isSame(now)) {
                    notificationConfig.every = {
                        year: atDate.year(),
                        month: atDate.month() + 1,
                        day: atDate.date(),
                        hour: atDate.hour(),
                        minute: atDate.minute()
                    };
                    notificationConfig.count = 1
                }

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
                notificationConfig.id = note.id;
                window.cordova.plugins.notification.local.schedule(notificationConfig);
                break;
            }
            case NoteRepeatType.Week: {
                let notificationConfigs = note.repeatValues.map((date) => {
                    return {
                        ...notificationConfig,
                        id: +`${note.id}${date}`,
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
                let notificationConfigs = note.repeatValues.map((date) => {
                    let atDate = moment(date).startOf("day").hour(note.startTime.hour()).minute(note.startTime.minute());
                    let now = moment().startOf("minute");

                    if (atDate.isBefore(now)) {
                        return;
                    }

                    let _notificationConfig = {
                        ...notificationConfig,
                        id: +`${note.id}${date}`,
                    }

                    if (!atDate.isSame(now)) {
                        _notificationConfig.every = {
                            year: atDate.year(),
                            month: atDate.month() + 1,
                            day: atDate.date(),
                            hour: atDate.hour(),
                            minute: atDate.minute()
                        };
                        _notificationConfig.count = 1;
                    }

                    return _notificationConfig;
                });

                window.cordova.plugins.notification.local.schedule(notificationConfigs.filter((notificationConfig) => Boolean(notificationConfig)));
                break;
            }
            default: break;
        }
    };

    clear = (note) => {
        if (!window.cordova) {
            return;
        }

        let ids = [note.id];
        if (note.repeatType === NoteRepeatType.Any || note.repeatType === NoteRepeatType.Week) {
            ids = note.repeatValues.map((date) => +`${note.id}${date}`);
        }

        window.cordova.plugins.notification.local.cancel(ids);

        if (note.repeatType === NoteRepeatType.Any || note.repeatType === NoteRepeatType.Week) {
            this.clearOldVersionNotes(note);
        }
    };

    clearOldVersionNotes(note) {
        let ids = [note.id];

        if (note.repeatType === NoteRepeatType.Any) {
            ids = note.repeatValues;
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