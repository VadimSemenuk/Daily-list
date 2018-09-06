import {createStore, applyMiddleware} from 'redux';
import thunkMiddleware from 'redux-thunk';

import notesService from "../services/notes.service";

import reducers from '../reducers';

async function initStore (settings) {   
    let moment = require("moment");

    let notes = await notesService.getNotesByDates(
        [
            moment().add(-1, "day"),
            moment().startOf("day"),
            moment().add(1, "day")
        ],
        settings.notesShowInterval
    );
    let password = !settings.password;
    let date = moment().startOf('day');

    return createStore(
        reducers,
        { 
            settings,
            password,
            notes,
            date
        },
        applyMiddleware(
            thunkMiddleware
        )
    );
}

export default initStore;