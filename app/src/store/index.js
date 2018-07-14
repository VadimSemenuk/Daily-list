import {createStore, applyMiddleware} from 'redux';
import thunkMiddleware from 'redux-thunk';
import moment from 'moment';

import notesService from "../services/notes.service";
import settingsService from "../services/settings.service";

import reducers from '../reducers';

async function initStore (settings) {
    if (!settings) {
        settings = await settingsService.getSettings();
    }
    let date = moment().startOf('day');
    let notes = await notesService.getNotesByDates(
        [
            moment(date).add(-1, "day"),
            moment(date).startOf("day"),
            moment(date).add(1, "day"),
        ],
        settings
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