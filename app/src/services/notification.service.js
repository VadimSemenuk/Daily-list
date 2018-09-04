class NotificationService {
    set = (id, note) => {       
        if (!window.cordova) return

        window.cordova.plugins.notification.local.hasPermission((granted) => { 
            if (!granted) {
                window.cordova.plugins.notification.local.requestPermission(function (granted) {});
            }

            let trigger = null;
            switch(note.repeatType) {
                case "no-repeat": {
                    trigger = { at: new Date(note.startTime.valueOf()) };
                    break;
                }
                case "day": {
                    // trigger = { every: { hour: note.startTime.hour(), minute: note.startTime.minute() } };
                    trigger = { every: "day", firstAt: new Date(note.startTime.valueOf()) };
                    break;
                } 
                case "week": {
                    // trigger = { every: { weekday: note.startTime.weekday() }};
                    trigger = { every: "week", firstAt: new Date(note.startTime.valueOf()) };
                    break;
                }
                case "any": {
                    for (let date of note.repeatDates) {
                        window.cordova.plugins.notification.local.schedule({
                            title: note.title || 'Уведомление о заметке',
                            text: this.getMessgae(note),
                            trigger: { at: new Date(date) },
                            id: date
                        });
                    }
                    return;
                }
            }

            window.cordova.plugins.notification.local.schedule({
                title: note.title || 'Уведомление о заметке',
                text: this.getMessgae(note),
                trigger,
                id                
            });
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