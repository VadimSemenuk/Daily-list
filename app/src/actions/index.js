import notesService from "../services/notes.service";
import settingsService from "../services/settings.service";
import calendarService from "../services/calendar.service";
import authService from "../services/auth.service";
import backupService from "../services/backup.service";

// notes
export function addNote (note, updateCount) {
    return function(dispatch, getState) {
        return notesService.addNote(note)
            .then((nextNote) => dispatch({
                type: "RECIVE_NOTE",
                note: nextNote
            }))
            .then(({note}) => {
                return updateCount && dispatch(getFullCount(note.added.valueOf()))
            })
            .then(({note}) => {
                let token = getState().user;
                return backupService.uploadorScheduleNoteBackup(note, "ADD", token);
            })
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

export function updateNote (note, updateCount) {
    return function(dispatch) {
        return notesService.updateNote(note)
        .then((nextNote) => {
            return dispatch({
                type: "UPDATE_NOTE",
                note: nextNote
            })
        })
        .then(({note}) => {
            return updateCount && dispatch(getFullCount(note.added.valueOf()))
        })
        .then(({note}) => {
            let token = getState().user;
            return backupService.uploadorScheduleNoteBackup(note, "UPDATE", token);
        });
    }
}

export function updateNoteDynamicFields (note, state) {
    return function(dispatch) {
        return notesService.updateNoteDynamicFields(note, state)
            .then((nextNote) => dispatch({
                type: "UPDATE_NOTE",
                note: nextNote,
                inserted: note.isShadow && !nextNote.isShadow
            }))
            .then(({note}) => {
                let token = getState().user;
                return backupService.uploadorScheduleNoteBackup(note, "UPDATE", token);
            })
    }
}

export function updateNoteDate (note, updateCount) {
    return function(dispatch) {
        return notesService.updateNoteDate(note).then((nextNote) => dispatch({
            type: "UPDATE_NOTE",
            note: nextNote
        }))
        .then(({note}) => {
            return updateCount && dispatch(getFullCount(note.added.valueOf()))
        })
        .then(() => {
            return dispatch(renderNotes())
        })
        .then(({note}) => {
            let token = getState().user;
            return backupService.uploadorScheduleNoteBackup(note, "UPDATE", token);
        })
    }
}

export function deleteNote (note, updateCount) {
    return function(dispatch) {
        return notesService.deleteNote(note)
            .then((note) => dispatch({
                type: "DELETE_NOTE",
                note
            }))
            .then(() => {
                return updateCount && dispatch(getFullCount(note.added.valueOf()))
            })
            .then(({note}) => {
                let token = getState().user;
                return backupService.uploadorScheduleNoteBackup(note, "DELETE", token);
            })     
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
export function setSetting (settingName, value, type, fn) {     
    return function(dispatch) {
        return settingsService.setSetting(settingName, value, type).then(() => dispatch({
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

// loader
export function triggerLoader (loader, state) {    
    return {
        type: "TRIGGER_LOADER",
        loader,
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

// auth
export function googleSignIn() {
    return function(dispatch) {
        dispatch(triggerLoader());

        return authService.googleSignIn().then((user) => {
            dispatch(triggerLoader());
            
            return dispatch({
                type: "RECIVE_USER",
                user
            })
        })
    }
}

export function googleSignOut() {
    return function(dispatch) {
        dispatch(triggerLoader());

        return authService.googleSignOut().then(() => {
            dispatch(triggerLoader());

            return dispatch({
                type: "CLEAR_USER"
            })
        })
    }
}

export function setToken(token) {
    return function(dispatch) {
        authService.setToken(token);
        return dispatch({
            type: "RECIVE_USER",
            user: token
        });
    }
}

// backup
export function uploadBackup() {
    return function(dispatch, getState) {
        dispatch(triggerLoader());

        let token = getState().user;

        return backupService.uploadBackup(token).then((backupFile) => {
            if (backupFile) {
                dispatch(setToken({...token, ...backupFile}));
            }
            dispatch(triggerLoader());
        });
    }
}

export function restoreBackup(token) {
    return function(dispatch) {
        dispatch(triggerLoader());

        return backupService.restoreBackup(token).then((isUpdated) => isUpdated && window.location.reload(true));
    }
}

export function getBackupFile(token) {
    return function(dispatch) {
        dispatch(triggerLoader());

        return backupService.getBackupFile(token).then((backupFile) => {
            if (backupFile) {
                dispatch(setToken({...token, backupFile: backupFile}));
            }
            dispatch(triggerLoader());
        });
    }
}

export function restoreLocalBackup() {
    return function () {
        return backupService.restoreLocalBackup().then((file) => file && window.location.reload(true));
    }
}