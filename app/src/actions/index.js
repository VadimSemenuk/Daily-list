import notesService from "../services/notes.service.js";
import settingsService from "../services/settings.service.js";

// notes
export function addNote (note, dateIndex) {
    return function(dispatch) {
        return notesService.addNote(note).then((note) => {
            if (dateIndex !== undefined) {
                return dispatch({
                    type: "RECIVE_NOTE",
                    dateIndex,
                    note
                })
            }
        });
    }
}

export function setNoteCheckedState (dateIndex, noteIndex, note, state) {
    return function(dispatch) {
        return notesService.setNoteCheckedState(note, state).then(() => dispatch({
            type: "SET_NOTE_CHECKED_STATE",
            dateIndex,
            noteIndex,
            state
        }));
    }
}

export function updateNoteDynamicFields (dateIndex, noteIndex, note, dynamicFields) {
    return function(dispatch) {
        return notesService.updateNoteDynamicFields(note, dynamicFields).then(() => dispatch({
            type: "UPDATE_NOTE_DYNAMIC_FIELDS",
            dateIndex, 
            noteIndex,
            dynamicFields
        }));
    }
}

export function deleteNote (dateIndex, noteIndex, note) {
    return function(dispatch) {
        return notesService.deleteNote(note).then(() => dispatch({
            type: "DELETE_NOTE",
            dateIndex, 
            noteIndex
        }));
    }
}

export function updateNote (dateIndex, noteIndex, note) {
    return function(dispatch) {
        return notesService.updateNote(note).then(() => dispatch({
            type: "UPDATE_NOTE",
            dateIndex, 
            noteIndex,
            note
        }))
    }
}

export function getNotesByDates (dates, settings) {
    return function(dispatch) {
        return notesService.getNotesByDates(dates, settings).then((notes) => {
            dispatch({
                type: "RECIVE_NOTES",
                dates,
                notes
            })
        });
    }
}

// date
export function setDate (dates, dateIndex, settings) {
    return function(dispatch) {
        return notesService.getNotesByDates(dates, settings).then((notes) => dispatch({
            type: "SET_DATE",
            date: dates[dateIndex],
            notes
        }));
    }
}

export function setListDate (date, dateIndexDate, dateIndex, settings) {
    return function(dispatch) {
        return notesService.getDayNotes(dateIndexDate, settings).then((notes) => dispatch({
            type: "SET_LIST_DATE",
            date,
            dateIndex,
            notes
        }));
    }
}

// settings
export function setSetting (settingName, value) {     
    return function(dispatch) {
        return settingsService.setSetting(settingName, value).then(() => dispatch({
            type: "SET_SETTING",
            settingName,
            value
        }));
    }
}

// password
export function setPasswordValid () {     
    return {
        type: "SET_VALID"
    }
}

// synchronization loader
export function triggerSynchronizationLoader (state) {    
    return {
        type: "TRIGGER_SYNCHRONIZATION_LOADER",
        state 
    }
}