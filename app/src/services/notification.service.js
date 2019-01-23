import moment from "moment";
import i18next from "i18next";

class NotificationService {
    set = async (id, note) => {
        if (!window.cordova) {
            // return;
        }

        // let hasPermission = await new Promise((resolve) => {
        //     window.cordova.plugins.notification.local.hasPermission((granted) => {
        //         if (!granted) {
        //             window.cordova.plugins.notification.local.requestPermission(resolve);
        //         }
        //     });
        // });
        //
        // if (!hasPermission) {
        //     window.plugins.toast.showLongBottom(i18next.t("error-notification-permission"));
        // }

        let notificationConfig = {
            title: note.title || 'Уведомление о заметке',
            text: this.getMessgae(note),
            id,
            sound: true
        };

        switch(note.repeatType) {
            case "no-repeat": {
                let atDate = moment(note.added).hour(note.startTime.hour()).minute(note.startTime.minute());
                atDate = new Date(atDate.valueOf());
                notificationConfig.trigger = { at: atDate };
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
                window.cordova.plugins.notification.local.schedule(notificationConfig);
                break;
            }
            case "week": {
                note.repeatDates.forEach((date) => {
                    // window.cordova.plugins.notification.local.schedule(
                    console.log(
                        {
                            ...notificationConfig,
                            id: `${date}_${note.uuid}`,
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
                    let atDate = moment(date).hour(note.startTime.hour()).minute(note.startTime.minute());
                    atDate = new Date(atDate.valueOf());

                    window.cordova.plugins.notification.local.schedule({
                        ...notificationConfig,
                        id: date,
                        trigger: { at: atDate }
                    });
                });
                break;
            }
            default: break;
        }
    };

    clear = (ids) => {
        if (!window.cordova) {
            return;
        }
        
        window.cordova.plugins.notification.local.cancel(ids);
    };

    getMessgae(data) {
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