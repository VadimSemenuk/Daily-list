import moment from "moment";

export function convertUTCDateTimeToLocal(msUtcDateTime, precision = "day") {
    let utcDateTime = moment.utc(msUtcDateTime);
    return moment({year: utcDateTime.year(), month: utcDateTime.month(), date: utcDateTime.date(), hour: utcDateTime.hour(), minute: utcDateTime.minute(), second: 0, millisecond: 0}).startOf(precision);
}

export function convertLocalDateTimeToUTC(msDateTime, precision = "day") {
    let dateTime = moment(msDateTime);
    return moment.utc({year: dateTime.year(), month: dateTime.month(), date: dateTime.date(), hour: dateTime.hour(), minute: dateTime.minute(), second: 0, millisecond: 0}).startOf(precision);
}