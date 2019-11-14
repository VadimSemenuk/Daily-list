import { combineReducers } from 'redux';

import notes from './notes';
import date from './date';
import settings from './settings';
import password from './password';
import loader from "./loader";
import calendar from "./calendar";
import user from "./user";
import meta from "./meta";
import error from "./error";
import trash from "./trash";
import search from "./search";

let reducers = combineReducers({
    settings,
    date,
    password,
    notes,
    loader,
    calendar,
    user,
    meta,
    error,
    trash,
    search,
});

export default reducers;