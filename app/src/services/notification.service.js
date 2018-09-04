class NotificationService {
    set = (id, note) => {       
        if (!window.cordova) return

        window.cordova.plugins.notification.local.hasPermission((granted) => { 
            if (!granted) {
                window.cordova.plugins.notification.local.requestPermission(function (granted) {});
            }

            let notificationConfig = {
                title: note.title || 'Уведомление о заметке',
                text: this.getMessgae(note),
                id
            }

            switch(note.repeatType) {
                case "no-repeat": {
                    notificationConfig.trigger = { at: new Date(note.startTime.valueOf()) };
                    break;
                }
                case "day": {
                    // trigger = { every: { hour: note.startTime.hour(), minute: note.startTime.minute() } };
                    notificationConfig.trigger = { every: "day", firstAt: new Date(note.startTime.valueOf()) };
                    break;
                } 
                case "week": {
                    // trigger = { every: { weekday: note.startTime.weekday() }};
                    notificationConfig.trigger = { every: "week", firstAt: new Date(note.startTime.valueOf()) };
                    break;
                }
                case "any": {
                    for (let date of note.repeatDates) {
                        notificationConfig.id = date;
                        notificationConfig.trigger = { at: new Date(date) };
                        window.cordova.plugins.notification.local.schedule(notificationConfig);
                    }
                    return;
                }
            }

            window.cordova.plugins.notification.local.schedule(notificationConfig);
        });       
    }

    clear = (ids) => {
        if (!window.cordova) return
        
        window.cordova.plugins.notification.local.cancel(ids)
    }

    getMessgae(data) {
        let startTime = "", 
            endTime = "";
        if (data.startTime) {
            startTime = data.startTime.format("HH:mm")
        };
        if (data.endTime) {
            endTime = data.endTime.format("HH:mm")
        }

        return `${startTime}${(data.startTime && data.endTime) ? " - " : ""}${endTime}\n${data.dynamicFields[0].value.length > 50 ? data.dynamicFields[0].value.slice(0, 47) + '...' : data.dynamicFields[0].value}`
    }
}

let notificationService = new NotificationService();

export default notificationService;