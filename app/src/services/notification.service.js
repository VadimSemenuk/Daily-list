class NotificationService {
    schedule = (id) => {
        if (!window.cordova) {
            return;
        }
        window.cordova.plugins.natives.scheduleNotification(id);
    };

    scheduleAll = async () => {
        if (!window.cordova) {
            return;
        }
        return new Promise((resolve) => window.cordova.plugins.natives.scheduleNotificationAll(resolve));
    };

    clear = (id) => {
        if (!window.cordova) {
            return;
        }
        window.cordova.plugins.natives.clearNotification(id);
    };

    clearAll = () => {
        if (!window.cordova) {
            return;
        }
        return new Promise((resolve) => window.cordova.plugins.natives.clearNotificationAll(resolve));
    };
}

let notificationService = new NotificationService();

export default notificationService;