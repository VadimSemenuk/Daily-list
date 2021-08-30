var Widget = {};

Widget.update = function(success, error) {
    cordova.exec(success, error, 'Widget', 'update');
};

module.exports = Widget;