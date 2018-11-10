import { combineReducers } from 'redux';

import notes from './notes';
import date from './date';
import settings from './settings';
import password from './password';
import loader from "./loader";
import calendar from "./calendar";
import user from "./user";
import meta from "./meta";

let reducers = combineReducers({
    settings,
    date,
    password,
    notes,
    loader,
    calendar,
    user,
    meta
});

export default reducers;