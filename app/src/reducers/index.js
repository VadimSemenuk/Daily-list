import { combineReducers } from 'redux';

import notes from './notes';
import date from './date';
import settings from './settings';
import password from './password';
import synchronization from "./synchronization"

let reducers = combineReducers({
    settings,
    date,
    password,
    notes,
    synchronization
});

export default reducers;