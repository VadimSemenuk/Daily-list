import { combineReducers } from 'redux';

import notes from './notes';
import date from './date';
import settings from './settings';
import password from './password';
import synchronization from "./synchronization";
import calendar from "./calendar";

let reducers = combineReducers({
    settings,
    date,
    password,
    notes,
    synchronization,
    calendar
});

export default reducers;