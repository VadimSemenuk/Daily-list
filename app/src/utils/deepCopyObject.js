import moment from "moment";

let toString = Object.prototype.toString;

function deepCopy(obj) {
    let rv;

    if (moment.isMoment(obj)) {
        rv = moment(obj)
    } else if (typeof obj === "object") {
        if (obj === null) {
            rv = null;
        } else {
            switch (toString.call(obj)) {
                case "[object Array]":
                    rv = obj.map(deepCopy);
                    break;
                case "[object Date]":
                    rv = new Date(obj);
                    break;
                case "[object RegExp]":
                    rv = new RegExp(obj);
                    break;
                default:
                    rv = Object.keys(obj).reduce(function(prev, key) {
                        prev[key] = deepCopy(obj[key]);
                        return prev;
                    }, {});
                    break;
            }
        }
    } else {
        rv = obj;
    }

    return rv;
}

export default deepCopy;