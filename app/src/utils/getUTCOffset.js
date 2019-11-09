import moment from "moment";

export default () => {
    return moment().utcOffset() * 60 * 1000;
}