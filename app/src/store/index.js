import {createStore, applyMiddleware} from 'redux';
import thunkMiddleware from 'redux-thunk';
import moment from 'moment';

import notesService from "../services/notes.service";

import reducers from '../reducers';

async function initStore (settings) {   
    let notes = await notesService.getNotesByDates(
        [
            moment().add(-1, "day"),
            moment().startOf("day"),
            moment().add(1, "day")
        ],
        "week"
    );
    let password = !settings.password;

    return createStore(
        reducers,
        { 
            settings,
            password,
            notes 
        },
        applyMiddleware(
            thunkMiddleware
        )
    );
}

export default initStore;