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
                dispatch(triggerErrorModal("error-note-add"));
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> addNote()",
                    note: {
                        ...note,
                        title: !!note.title,
                        dynamicFields: !!note.dynamicFields
                    },
                    deviceId
                });
            });
    }
}

export function getNotesByDates (dates, period) {
    return function(dispatch) {
        return notesService.getNotesByDates(dates, period)
            .then((notes) => {
                dispatch({
                    type: "RECIVE_NOTES",
                    dates,
                    notes
                })
            })
            .catch((err) => {
                console.warn(err);
            })
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
                token.settings && token.settings.autoBackup && dispatch(uploadBackup(note, token, true));        
            })
            .catch((err) => {
                dispatch(triggerErrorModal("error-note-update"));
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> updateNote()",
                    note: {
                        ...note,
                        title: !!note.title,
                        dynamicFields: !!note.dynamicFields
                    },
                    deviceId
                });
            });
    }
}

export function updateNoteDynamicFields (note, state, updateCount) {
    return function(dispatch, getState) {
        return notesService.updateNoteDynamicFields(note, state)
            .then((nextNote) => {
                dispatch({
                    type: "UPDATE_NOTE",
                    note: nextNote,
                    inserted: note.isShadow && !nextNote.isShadow
                });

                let state = getState();

                updateCount
                && state.settings.calendarNotesCounter
                && !state.settings.calendarNotesCounterIncludeFinished
                && dispatch(getFullCount(nextNote.added.valueOf()));

                let token = state.user;
                token.settings && token.settings.autoBackup && dispatch(uploadBackup(nextNote, token));
            })
            .catch((err) => {
                dispatch(triggerErrorModal("error-note-update"));
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> updateNoteDynamicFields()",
                    note: {
                        ...note,
                        title: !!note.title,
                        dynamicFields: !!note.dynamicFields
                    },
                    deviceId
                });
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
            dispatch(triggerErrorModal("error-note-update"));
            let deviceId = getState().meta.deviceId;            
            deviceService.logError(err, {
                path: "action/index.js -> updateNoteDate()",
                note: {
                    ...note,
                    title: !!note.title,
                    dynamicFields: !!note.dynamicFields
                },
                deviceId
            });
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
                dispatch(triggerErrorModal("error-note-delete"));
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> deleteNote()",
                    note: {
                        ...note,
                        title: !!note.title,
                        dynamicFields: !!note.dynamicFields
                    },
                    deviceId
                });
            });
    }
}

export function getDeletedNotes () {
    return function(dispatch, getState) {
        return notesService.getDeletedNotes()
            .then((items) => dispatch({
                type: "RECIVE_TRASH_NOTES",
                items
            }))
            .catch((err) => {
                dispatch(triggerErrorModal("error-note-get-trash"));
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> getDeletedNotes()",
                    deviceId
                });
            });
    }
}

export function restoreNote (note) {
    return function(dispatch, getState) {
        return notesService.restoreNote(note)
            .then((note) => dispatch({
                type: "RESTORE_NOTE",
                note
            }))
            .then(({note}) => {
                let date = getState().date;
                dispatch(getFullCount(date.valueOf()));
                dispatch(updateNotes());

                let token = getState().user;
                token.settings && token.settings.autoBackup && dispatch(uploadBackup(note, token));
            })
            .catch((err) => {
                dispatch(triggerErrorModal("error-note-restore"));
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> restoreNote()",
                    note: {
                        ...note,
                        title: !!note.title,
                        dynamicFields: !!note.dynamicFields
                    },
                    deviceId
                });
            });
    }
}

export function cleanDeletedNotes () {
    return function(dispatch, getState) {
        let state = getState();
        let deletedNotesUUIDs = state.trash.map((n) => n.uuid);
        debugger;
        return notesService.cleanDeletedNotes()
            .then(() => dispatch({
                type: "CLEAN_TRASH",
            }))
            .then(() => {
                let token = state.user;
                token.settings && token.settings.autoBackup && dispatch(removeFromBackup(deletedNotesUUIDs, token));
            })
            .catch((err) => {
                dispatch(triggerErrorModal("clean-trash-error"));
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> cleanDeletedNotes()",
                    deviceId
                });
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

export function updateNotes() {
    return function(dispatch, getState) {
        let state = getState();
        let dates = state.notes.map((n) => n.date);

        return notesService.getNotesByDates(dates)
            .then((notes) => dispatch({
                type: "UPDATE_NOTES",
                notes
            }))
            .catch((err) => {
                dispatch(triggerErrorModal("error-get-notes"));
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> updateNotes()",
                    dates, deviceId
                });
            });
    }
}

export function setDatesAndUpdateNotes (dates, dateIndex, period) {
    return function(dispatch, getState) {
        return notesService.getNotesByDates(dates, period)
            .then((notes) => dispatch({
                type: "SET_DATES_AND_UPDATE_NOTES",
                date: dates[dateIndex],
                notes
            }))
            .catch((err) => {
                dispatch(triggerErrorModal("error-get-notes"));
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> setDatesAndUpdateNotes()",
                    dates, dateIndex, period, deviceId
                });
            });
    }
}

export function updateDatesAndNotes (date, preRenderDate, nextIndex) {
    return function(dispatch, getState) {
        return notesService.getDayNotes(preRenderDate)
            .then((notes) => dispatch({
                type: "UPDATE_DATES_AND_NOTES",
                notes,
                nextIndex,
                date
            }))
            .catch((err) => {
                dispatch(triggerErrorModal("error-get-notes"));
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> updateDatesAndNotes()",
                    date, preRenderDate, nextIndex, deviceId
                });
            });
    }
}

// settings
export function setSetting (settingName, value, fn) {     
    return function(dispatch, getState) {
        return settingsService.setSetting(settingName, value)
            .then(() => dispatch({
                type: "SET_SETTING",
                settingName,
                value
            }))
            .then(() => fn && fn())
            .catch((err) => {
                dispatch(triggerErrorModal("error-get-notes"));
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> setSetting()",
                    settingName, value, deviceId
                });
            });
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
    return function(dispatch, getState) {
        let includeFinished = getState().settings.calendarNotesCounterIncludeFinished;
        return calendarService.getCount(date, period, includeFinished)
            .then((nextCount) => dispatch({
                type: "GET_COUNT",
                nextCount 
            }))
            .catch((err) => {
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> getCount()",
                    date, period, deviceId
                });
            });
    }
}

export function getFullCount (date) {
    return function(dispatch, getState) {
        let includeFinished = getState().settings.calendarNotesCounterIncludeFinished;
        return calendarService.getFullCount(date, includeFinished)
            .then((nextCount) => dispatch({
                type: "GET_COUNT",
                nextCount 
            }))
            .catch((err) => {
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> getFullCount()",
                    date, deviceId
                });
            });
    }
}

// auth
export function googleSignIn() {
    return function(dispatch, getState) {
        dispatch(triggerLoader());

        return authService.googleSignIn()
            .then((user) => {
                if (!user) {
                    throw new Error("Failed to login");
                }

                dispatch(triggerLoader());
                
                if (!getState().meta.nextVersionMigrated) {
                    dispatch(uploadBatchBackup());
                    dispatch(setNextVersionMigrationState(true));
                }

                return dispatch({
                    type: "RECIVE_USER",
                    user
                })
            })
            .catch((err) => {
                dispatch(triggerErrorModal("error-sign-in"));
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> googleSignIn()",
                    deviceId
                });
            })
    }
}

export function googleSignOut() {
    return function(dispatch, getState) {
        dispatch(triggerLoader());

        return authService.googleSignOut()
            .then(() => {
                dispatch(triggerLoader());

                return dispatch({
                    type: "CLEAR_USER"
                })
            })
            .catch((err) => {
                dispatch(triggerErrorModal("error-sign-out"));
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> googleSignOut()",
                    deviceId
                });
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
export function uploadBackup(note, token, removeForkNotes) {
    return function(dispatch, getState) {
        if (!token) {
            token = getState().user;
        }

        return debouncedUploadBackup(note, token, removeForkNotes, dispatch, getState);
    }
}
let debouncedUploadBackup = throttle((note, token, removeForkNotes, dispatch, getState) => {
    return notesService.getNoteForBackup(note.key)
        .then((noteForBackup) => {
            return backupService.uploadNoteBackup(noteForBackup[0], token, removeForkNotes);
        })
        .then(() => notesService.setNoteBackupState(note.key, true, true))
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
            dispatch(triggerErrorModal("error-backup-upload"));
            let deviceId = getState().meta.deviceId;
            deviceService.logError(err, {
                note: {
                    ...note,
                    title: !!note.title,
                    dynamicFields: !!note.dynamicFields
                },
                removeForkNotes,
                path: "action/index.js -> uploadBackup()",
                deviceId
            });
        })
}, 5000);

export function uploadBatchBackup() {
    return function(dispatch, getState) {
        dispatch(triggerLoader());
        let token = getState().user;

        return notesService.getNoteForBackup()
            .then((notes) => {
                return backupService.uploadNotesBatchBackup(notes, token);
            })
            .then(() => notesService.setNoteBackupState(null, true, true))
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
                dispatch(triggerErrorModal("error-backup-upload"));
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> uploadBatchBackup()",
                    deviceId
                });
            })
    }
}

export function removeFromBackup(noteUUIDs) {
    return function(dispatch, getState) {
        dispatch(triggerLoader());
        let token = getState().user;

        return backupService.removeFromBackup(noteUUIDs, token)
            .catch((err) => {
                dispatch(triggerLoader());
                dispatch(triggerErrorModal("error-backup-upload"));
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> remvoeFromBackup()",
                    noteUUIDs,
                    deviceId
                });
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
            })
            .catch((err) => {
                dispatch(triggerLoader());
                dispatch(triggerErrorModal("error-backup-restore"));
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> restoreBackup()",
                    deviceId
                });
            })
    }
}

export function updateLastBackupTime() {
    return function(dispatch, getState) {
        dispatch(triggerLoader());

        let token = getState().user;

        return backupService.getUserLastBackupTime(token)
            .then((time) => {
                dispatch(triggerLoader());
                if (!time) {
                    return;
                }
                let nextToken = { 
                    ...token, 
                    backup: {
                        ...token.backup,
                        lastBackupTime: moment(time).valueOf()
                    }  
                };
                dispatch(setToken(nextToken));
            })
            .catch((err) => {
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> updateLastBackupTime()",
                    deviceId
                });
            })
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

// error modal
export function triggerErrorModal(message) {
    return {
        type: "TRIGGER_ERROR_MODAL",
        message
    }
}