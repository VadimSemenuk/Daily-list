import notesService from "../services/notes.service.js";
import notificationService from "../services/notification.service";
import settingsService from "../services/settings.service.js";

// notes
export function addNote (note) {
    return function(dispatch) {
        return notesService.addNote(note)
            .then((note) => {
                notificationService.clear(note.key);           
                if (note.notificate) {
                    notificationService.set(note.key, note);
                };
                return note;
            })
            .then((note) => {
                return dispatch({
                    type: "RECIVE_NOTE",
                    note
                })
            })
    }
}

export function setNoteCheckedState (note, state) {
    return function(dispatch) {
        return notesService.setNoteCheckedState(note, state).then(() => dispatch({
            type: "SET_NOTE_CHECKED_STATE",
            note,
            state
        }));
    }
}

export function updateNoteDynamicFields (note, dynamicFields) {
    return function(dispatch) {
        return notesService.updateNoteDynamicFields(note, dynamicFields).then(() => dispatch({
            type: "UPDATE_NOTE_DYNAMIC_FIELDS",
            note,
            dynamicFields
        }));
    }
}

export function deleteNote (note) {
    return function(dispatch) {
        return notesService.deleteNote(note)
            .then((note) => {
                notificationService.clear(note.key);  
                return note;
            })
            .then((note) => dispatch({
                type: "DELETE_NOTE",
                note
            }))
    }
}

export function updateNote (note) {
    return function(dispatch) {
        return notesService.updateNote(note).then(() => dispatch({
            type: "UPDATE_NOTE",
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
export function setCurrentDate (date) {
    return {
        type: "SET_CURRENT_DATE",
        date
    }
}

export function setDatesAndUpdateNotes (dates, dateIndex, settings) {
    return function(dispatch) {
        return notesService.getNotesByDates(dates, settings).then((notes) => dispatch({
            type: "SET_DATES_AND_UPDATE_NOTES",
            date: dates[dateIndex],
            notes
        }));
    }
}

export function updateDatesAndNotes (date, preRenderDate, nextIndex) {
    return function(dispatch) {
        return notesService.getDayNotes(preRenderDate).then((notes) => dispatch({
            type: "UPDATE_DATES_AND_NOTES",
            notes,
            nextIndex,
            date
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