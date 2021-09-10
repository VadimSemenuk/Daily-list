var Widget = {};

Widget.update = function(success, error) {
    cordova.exec(success, error, 'Widget', 'update');
};

Widget.updateList = function(success, error) {
    cordova.exec(success, error, 'Widget', 'updateList');
};

Widget.events = {};

Widget.addEventListener = function(event, callback) {
    if (!Widget.events[event]) {
        Widget.events[event] = {
            listeners: []
        };
    }

    Widget.events[event].listeners.push(callback);
    cordova.exec(null, null, 'Widget', 'eventAdded', [event]);
};

Widget.removeEventListener = function(event, callback) {
    var nextListeners = [];

    for (var i = 0; i < Widget.events[event].listeners.length; i++) {
        var eventListener = Widget.events[event].listeners[i];
        if (eventListener != callback) {
            nextListeners.push(eventListener);
        }
    }

    Widget.events[event].listeners = nextListeners;
};

Widget.removeEvents = function() {
    Widget.events = {};
};

Widget.fireEvent = function(event, props) {
    for (var i = 0; i < Widget.events[event].listeners.length; i++) {
        Widget.events[event].listeners[i](props);
    }
};

module.exports = Widget;
