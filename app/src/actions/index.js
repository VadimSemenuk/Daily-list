import moment from "moment";

import notesService from "../services/notes.service";
import settingsService from "../services/settings.service";
import calendarService from "../services/calendar.service";
import authService from "../services/auth.service";
import backupService from "../services/backup.service";

import throttle from "../utils/throttle";
import deviceService from "../services/device.service";

// notes
export function addNote (note, updateCount) {
    return function(dispatch, getState) {
        return notesService.addNote(note)
            .then((nextNote) => dispatch({
                type: "RECIVE_NOTE",
                note: nextNote
            }))
            .then(({note}) => {
                updateCount && dispatch(getFullCount(note.added.valueOf()));

                let token = getState().user;
                token.settings && token.settings.autoBackup && dispatch(uploadBackup(note, token));
            })
            .catch((err) => {
                console.warn(err);
            });
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
    return function(dispatch, getState) {
        return notesService.updateNote(note)
        .then((nextNote) => {
            return dispatch({
                type: "UPDATE_NOTE",
                note: nextNote
            })
        })
        .then(({note}) => {
            updateCount && dispatch(getFullCount(note.added.valueOf()));

            let token = getState().user;
            token.settings && token.settings.autoBackup && dispatch(uploadBackup(note, token));        
        })
        .catch((err) => {
            console.warn(err);
        });
    }
}

export function updateNoteDynamicFields (note, state) {
    return function(dispatch, getState) {
        return notesService.updateNoteDynamicFields(note, state)
            .then((nextNote) => {
                dispatch({
                    type: "UPDATE_NOTE",
                    note: nextNote,
                    inserted: note.isShadow && !nextNote.isShadow
                });

                let token = getState().user;
                token.settings && token.settings.autoBackup && dispatch(uploadBackup(nextNote, token));
            })
            .catch((err) => {
                console.warn(err);
            });
    }
}

export function updateNoteDate (note, updateCount) {
    return function(dispatch, getState) {
        return notesService.updateNoteDate(note).then((nextNote) => dispatch({
            type: "UPDATE_NOTE",
            note: nextNote
        }))
        .then(({note}) => {
            updateCount && dispatch(getFullCount(note.added.valueOf()));
            return Promise.resolve(note);
        })
        .then((note) => {
            dispatch(renderNotes());

            let token = getState().user;
            token.settings && token.settings.autoBackup && dispatch(uploadBackup(note, token));            
        })
        .catch((err) => {
            console.warn(err);
        });
    }
}

export function deleteNote (note, updateCount) {
    return function(dispatch, getState) {
        return notesService.deleteNote(note)
            .then((note) => dispatch({
                type: "DELETE_NOTE",
                note
            }))
            .then(({note}) => {
                updateCount && dispatch(getFullCount(note.added.valueOf()));

                let token = getState().user;
                token.settings && token.settings.autoBackup && dispatch(uploadBackup(note, token));
            })
            .catch((err) => {
                console.warn(err);
            });
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
    return function(dispatch, getState) {
        dispatch(triggerLoader());

        return authService.googleSignIn().then((user) => {
            dispatch(triggerLoader());
            
            if (!getState().meta.nextVersionMigrated) {
                dispatch(uploadBatchBackup());
            }

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
export function uploadBackup(note, token) {
    return function(dispatch, getState) {
        if (!token) {
            token = getState().user;
        }

        return debouncedUploadBackup(note, token, dispatch);
    }
}
let debouncedUploadBackup = throttle((note, token, dispatch) => {
    return notesService.getNoteForBackup(note.key)
        .then((noteForBackup) => {
            return backupService.uploadNoteBackup(noteForBackup[0], token);
        })
        .then((isBackuped) => {
            if (!isBackuped) {
                throw Error("not backuped");
            }
            return notesService.setNoteBackupState(note.key, true, true);
        })
        .then(() => {
            let nextToken = { 
                ...token, 
                backup: {
                    ...token.backup,
                    lastBackupTime: moment().valueOf()
                }  
            };
            return dispatch(setToken(nextToken));
        })
        .catch((err) => {
            console.warn(err);
            return null
        })
}, 5000)

export function uploadBatchBackup() {
    return function(dispatch, getState) {
        dispatch(triggerLoader());
        let token = getState().user;

        return notesService.getNoteForBackup()
            .then((notes) => {
                return backupService.uploadNotesBatchBackup(notes, token);
            })
            .then((isBackuped) => {
                if (!isBackuped) {
                    throw Error("not backuped");
                }
                return notesService.setNoteBackupState(null, true, true);
            })
            .then(() => {
                let nextToken = { 
                    ...token, 
                    backup: {
                        ...token.backup,
                        lastBackupTime: moment().valueOf()
                    }  
                };
                dispatch(setToken(nextToken));
                dispatch(triggerLoader());
            })
            .catch((err) => {
                dispatch(triggerLoader());
                console.warn(err);
            })
    }
}

export function restoreBackup() {
    return function(dispatch, getState) {
        dispatch(triggerLoader());

        let token = getState().user;

        return backupService.restoreNotesBackup(token)
            .then((isUpdated) => {
                dispatch(triggerLoader());
                isUpdated && window.location.reload(true);
            });
    }
}

// meta
export function setNextVersionMigrationState(state) {
    return function(dispatch) {
        return deviceService.setNextVersionMigrationState(state)
            .then(() => {
                dispatch({
                    type: "SET_NEXTVERSIONMIGRATION_STATE",
                    state
                })
            })
    }
}