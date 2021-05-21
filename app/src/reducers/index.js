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
    sidenav
});

export default reducers;