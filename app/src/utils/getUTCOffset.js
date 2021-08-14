import moment from "moment";

export default (date) => {
    return moment(date).utcOffset() * 60 * 1000;
}