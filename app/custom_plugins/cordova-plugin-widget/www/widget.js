var Widget = {};

Widget.update = function(success, error) {
    cordova.exec(success, error, 'Widget', 'update');
};

Widget.isEventsAllowed = false;
Widget.eventListeners = [];

Widget.addEventListener = function(event, callback, scope) {
    if (!Widget.isEventsAllowed) {
        Widget.isEventsAllowed = true;
        cordova.exec(null, null, 'Widget', 'fireEvents');
    }

    Widget.eventListeners.push({
        event: event,
        callback: callback,
        scope: scope
    });
};

Widget.removeEventListener = function(event, callback) {
    var nextEventListeners = [];

    for (var i = 0; i < Widget.eventListeners.length; i++) {
        var eventListener = Widget.eventListeners[i];
        if (eventListener.event !== event && eventListener.callback != callback) {
            nextEventListeners.push(eventListener);
        }
    }
};

Widget.removeEventListeners = function() {
    Widget.eventListeners = [];
};

Widget.fireEvent = function(event, props) {
    for (var i = 0; i < Widget.eventListeners.length; i++) {
        var eventListener = Widget.eventListeners[i];
        if (eventListener.event === event) {
            eventListener.callback(props)
        }
    }
};

module.exports = Widget;
