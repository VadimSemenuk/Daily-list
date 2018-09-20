import notesService from "../services/notes.service";
import settingsService from "../services/settings.service";
import calendarService from "../services/calendar.service";

// notes
export function addNote (note) {
    return function(dispatch) {
        return notesService.addNote(note)
            .then((note) => dispatch({
                type: "RECIVE_NOTE",
                note
            }))
            .then(() => dispatch(getFullCount(note.added.valueOf())));
    }
}

export function getNotesByDates (dates, period) {
    return function(dispatch) {
        return notesService.getNotesByDates(dates, period).then((notes) => {
            dispatch({
                type: "RECIVE_NOTES",
                dates,
                notes
            })
        });
    }
}

export function updateNote (note) {
    return function(dispatch) {
        return notesService.updateNote(note)
        .then(() => dispatch({
            type: "UPDATE_NOTE",
            note
        }))
        .then(() => dispatch(getFullCount(note.added.valueOf())));
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

export function updateNoteDate (note, date) {
    return function(dispatch) {
        return notesService.updateNoteDate(note, date).then(() => dispatch({
            type: "UPDATE_NOTE_DATE",
            note,
            date
        }))
        .then(() => dispatch(getFullCount(note.added.valueOf())));
    }
}

export function deleteNote (note) {
    return function(dispatch) {
        return notesService.deleteNote(note)
            .then((note) => dispatch({
                type: "DELETE_NOTE",
                note
            }))
        .then(() => dispatch(getFullCount(note.added.valueOf())));        
    }
}

export function renderNotes () {
    return {
        type: "RENDER_NOTES"
    }
}

// date
export function setCurrentDate (date) {
    return {
        type: "SET_CURRENT_DATE",
        date
    }
}

export function setDatesAndUpdateNotes (dates, dateIndex, period) {
    return function(dispatch) {
        return notesService.getNotesByDates(dates, period).then((notes) => dispatch({
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


export function updateWeekDatesAndNotes (date, preRenderDate, nextIndex) {
    return function(dispatch) {
        return notesService.getWeekNotes(preRenderDate).then((notes) => dispatch({
            type: "UPDATE_WEEK_DATES_AND_NOTES",
            notes,
            nextIndex,
            date
        }));
    }
}

// settings
export function setSetting (settingName, value, fn) {     
    return function(dispatch) {
        return settingsService.setSetting(settingName, value).then(() => dispatch({
            type: "SET_SETTING",
            settingName,
            value
        }))
        .then(() => fn && fn())
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

// calendar 
export function getCount (date, period) {    
    return function(dispatch) {
        return calendarService.getCount(date, period).then((nextCount) => dispatch({
            type: "GET_COUNT",
            nextCount 
        }));
    }
}

export function getFullCount (date, period) {    
    return function(dispatch) {
        return calendarService.getFullCount(date, period).then((nextCount) => dispatch({
            type: "GET_COUNT",
            nextCount 
        }));
    }
}