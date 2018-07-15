class NotificationService {
    set = (id, data) => {
        if (!window.cordova) return

        window.cordova.plugins.notification.local.hasPermission((granted) => { 
            window.cordova.plugins.notification.local.schedule({
                title: data.title || 'Уведомление о заметке',
                text: this.getMessgae(data),
                trigger: { at: new Date(data.startTime.valueOf()) },
                id                
            });
        });       
    }

    clear = (id) => {
        if (!window.cordova) return
        
        window.cordova.plugins.notification.local.clear(id)
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