import {createStore, applyMiddleware} from 'redux';
import thunkMiddleware from 'redux-thunk';

import notesService from "../services/notes.service";
import authService from "../services/auth.service";
import deviceService from "../services/device.service";

import reducers from '../reducers';

async function initStore (settings) {   
    let moment = require("moment");

    let cur = moment().startOf("day");
    let prev = moment(cur).add(-1, "day");
    let next = moment(cur).add(1, "day");

    let notes = await notesService.getNotesByDates([prev, cur, next], settings.notesShowInterval);
    let password = !settings.password;
    let meta = await deviceService.getMetaInfo();

    return createStore(
        reducers,
        { 
            settings,
            password,
            notes,
            date: cur,
            user: authService.getToken(),
            meta
        },
        applyMiddleware(
            thunkMiddleware
        )
    );
}

export default initStore;