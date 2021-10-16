import moment from "moment";

import {convertUTCDateTimeToLocal} from "./convertDateTimeLocale";

export function getTime(_dateTime) {
    let dateTime = moment(_dateTime);

    let time = convertUTCDateTimeToLocal(0);
    time.hour(dateTime.hour());
    time.minute(dateTime.minute());

    return time;
}