import { combineReducers } from 'redux';

import notes from './notes';
import date from './date';
import settings from './settings';
import password from './password';
import loader from "./loader";
import calendar from "./calendar";
import user from "./user";
import error from "./error";
import trash from "./trash";
import search from "./search";
import sidenav from "./sidenav";
import meta from "./meta";
import tags from "./tags";

let reducers = combineReducers({
    settings,
    date,
    password,
    notes,
    loader,
    calendar,
    user,
    error,
    trash,
    search,
    sidenav,
    meta,
    tags
});

export default reducers;