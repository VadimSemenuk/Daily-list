class PermissionService {
    checkPermission (permissions, add) {
        return new Promise((resolve) => {
            window.cordova.plugins.permissions.hasPermission(permissions, (status) => {
                if (status.hasPermission) {
                    resolve(true);
                } else {
                    if (add) {
                        this.requestPermission(permissions);
                    }
                    resolve(false);             
                }
            });
        })
    }
    
    requestPermission (permissions) {
        return new Promise((resolve, reject) => {
            window.cordova.plugins.permissions.requestPermission(permissions, resolve, reject);
        })
    }
}

let permissionService = new PermissionService();

export default permissionService;