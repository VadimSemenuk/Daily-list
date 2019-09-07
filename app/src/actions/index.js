import notesService from "../services/notes.service";
import settingsService from "../services/settings.service";
import calendarService from "../services/calendar.service";
import authService from "../services/auth.service";
import backupService from "../services/backup.service";

import {throttleAction} from "../utils/throttle";
import logsService from "../services/logs.service";

// notes
export function addNote (note) {
    return function(dispatch, getState) {
        return notesService.addNote(note)
            .then((nextNote) => dispatch({
                type: "RECEIVE_NOTE",
                note: nextNote
            }))
            .then(({note}) => {
                let state = getState();

                state.settings.calendarNotesCounter && dispatch(getFullCount(note.added.valueOf()));
                dispatch(saveBackup());
            })
            .catch((err) => {
                dispatch(triggerErrorModal("error-note-add"));
                let deviceId = getState().meta.deviceId;
                logsService.logError(
                    err,
                    {
                        path: "action/index.js -> addNote()",
                        note: {
                            ...note,
                            title: !!note.title,
                            dynamicFields: !!note.dynamicFields
                        }
                    },
                    deviceId
                );
            });
    }
}

export function updateNote (note, prevNote) {
    return function(dispatch, getState) {
        return notesService.updateNote(note, prevNote)
            .then((nextNote) => {
                return dispatch({
                    type: "UPDATE_NOTE",
                    note: nextNote,
                    prevNote: prevNote
                })
            })
            .then(({note}) => {
                let state = getState();

                state.settings.calendarNotesCounter && dispatch(getFullCount(note.added.valueOf()));
                dispatch(saveBackup());
            })
            .catch((err) => {
                dispatch(triggerErrorModal("error-note-update"));
                let deviceId = getState().meta.deviceId;
                logsService.logError(
                    err,
                    {
                        path: "action/index.js -> updateNote()",
                        note: {
                            ...note,
                            title: !!note.title,
                            dynamicFields: !!note.dynamicFields
                        },
                    },
                    deviceId
                );
            });
    }
}

export function updateNoteDynamicFields (note, updatedState) {
    return function(dispatch, getState) {
        return notesService.updateNoteDynamicFields(note, updatedState)
            .then((nextNote) => {
                dispatch({
                    type: "UPDATE_NOTE",
                    note: nextNote,
                    inserted: note.isShadow && !nextNote.isShadow
                });

                let state = getState();

                updatedState.hasOwnProperty('finished')
                && state.settings.calendarNotesCounter
                && !state.settings.calendarNotesCounterIncludeFinished
                && dispatch(getFullCount(nextNote.added.valueOf()));

                updatedState.hasOwnProperty('finished') && dispatch(renderNotes());

                dispatch(saveBackup());
            })
            .catch((err) => {
                dispatch(triggerErrorModal("error-note-update"));
                let deviceId = getState().meta.deviceId;
                logsService.logError(
                    err,
                    {
                        path: "action/index.js -> updateNoteDynamicFields()",
                        note: {
                            ...note,
                            title: !!note.title,
                            dynamicFields: !!note.dynamicFields
                        },
                    },
                    deviceId
                );
            });
    }
}

export function updateNoteDate (note, nextDate) {
    return function(dispatch, getState) {
        return notesService.updateNoteDate(note, nextDate)
            .then((nextNote) => dispatch({
                type: "UPDATE_NOTE",
                note: nextNote
            }))
            .then(({note}) => {
                let state = getState();

                state.settings.calendarNotesCounter && dispatch(getFullCount(note.added.valueOf()));
                dispatch(renderNotes());

                dispatch(saveBackup());
            })
            .catch((err) => {
                dispatch(triggerErrorModal("error-note-update"));
                let deviceId = getState().meta.deviceId;
                logsService.logError(
                    err,
                    {
                        path: "action/index.js -> updateNoteDate()",
                        note: {
                            ...note,
                            title: !!note.title,
                            dynamicFields: !!note.dynamicFields
                        }
                    },
                    deviceId
                );
            });
    }
}

export function deleteNote (note) {
    return function(dispatch, getState) {
        return notesService.deleteNote(note)
            .then((note) => dispatch({
                type: "DELETE_NOTE",
                note
            }))
            .then(({note}) => {
                let state = getState();

                state.settings.calendarNotesCounter && dispatch(getFullCount(note.added.valueOf()));
                dispatch(saveBackup());
            })
            .catch((err) => {
                dispatch(triggerErrorModal("error-note-delete"));
                let deviceId = getState().meta.deviceId;
                logsService.logError(
                    err,
                    {
                        path: "action/index.js -> deleteNote()",
                        note: {
                            ...note,
                            title: !!note.title,
                            dynamicFields: !!note.dynamicFields
                        }
                    },
                    deviceId
                );
            });
    }
}

export function getDeletedNotes () {
    return function(dispatch, getState) {
        return notesService.getDeletedNotes()
            .then((items) => dispatch({
                type: "RECEIVE_DELETED_NOTES",
                items
            }))
            .catch((err) => {
                dispatch(triggerErrorModal("error-note-get-trash"));
                let deviceId = getState().meta.deviceId;
                logsService.logError(
                    err,
                    {
                        path: "action/index.js -> getDeletedNotes()",
                    },
                    deviceId
                );
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
                let state = getState();

                state.settings.calendarNotesCounter && dispatch(getFullCount(state.date.valueOf()));
                dispatch(updateNotes());

                dispatch(saveBackup());
            })
            .catch((err) => {
                dispatch(triggerErrorModal("error-note-restore"));
                let deviceId = getState().meta.deviceId;
                logsService.logError(
                    err,
                    {
                        path: "action/index.js -> restoreNote()",
                        note: {
                            ...note,
                            title: !!note.title,
                            dynamicFields: !!note.dynamicFields
                        },
                    },
                    deviceId
                );
            });
    }
}

export function cleanDeletedNotes () {
    return function(dispatch, getState) {
        return notesService.cleanDeletedNotes()
            .then(() => dispatch({
                type: "CLEAN_TRASH",
            }))
            .then(() => {
                dispatch(saveBackup());
            })
            .catch((err) => {
                dispatch(triggerErrorModal("clean-trash-error"));
                let deviceId = getState().meta.deviceId;
                logsService.logError(
                    err,
                    {
                        path: "action/index.js -> cleanDeletedNotes()",
                    },
                    deviceId
                );
            });
    }
}

export function renderNotes () {
    return {
        type: "RENDER_NOTES"
    }
}

export function updateNotesManualSortIndex(notes) {
    return function (dispatch) {
        dispatch({
            type: "UPDATE_MANUAL_SORT_INDEX",
            notes: notes
        });

        notesService.updateNotesManualSortIndex(notes)
            .then((insertedNotes) => {
                dispatch({
                    type: "UPDATE_NOTE",
                    notes: insertedNotes.map((insertedNote) => ({note: insertedNote, inserted: true}))
                });
            })
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

        let dates = null;
        if (state.settings.notesScreenMode === 1) {
            dates = state.notes.map((n) => n.date);
        }

        return notesService.getNotes(state.settings.notesScreenMode, dates)
            .then((notes) => dispatch({
                type: "UPDATE_NOTES",
                notes
            }))
            .catch((err) => {
                dispatch(triggerErrorModal("error-get-notes"));
                let deviceId = getState().meta.deviceId;
                logsService.logError(
                    err,
                    {
                        path: "action/index.js -> updateNotes()",
                        dates
                    },
                    deviceId
                );
            });
    }
}

export function setDatesAndUpdateNotes (dates, dateIndex, notesScreenMode) {
    return function(dispatch, getState) {
        return notesService.getNotes(notesScreenMode, dates)
            .then((notes) => dispatch({
                type: "SET_DATES_AND_UPDATE_NOTES",
                date: dates[dateIndex],
                notes
            }))
            .catch((err) => {
                dispatch(triggerErrorModal("error-get-notes"));
                let deviceId = getState().meta.deviceId;
                logsService.logError(
                    err,
                    {
                        path: "action/index.js -> setDatesAndUpdateNotes()",
                        dates, dateIndex
                    },
                    deviceId
                );
            });
    }
}

export function updateDatesAndNotes (date, preRenderDate, nextIndex, notesScreenMode) {
    return function(dispatch, getState) {
        return notesService.getNotes(notesScreenMode, preRenderDate)
            .then((notes) => dispatch({
                type: "UPDATE_DATES_AND_NOTES",
                notes,
                nextIndex,
                date
            }))
            .catch((err) => {
                dispatch(triggerErrorModal("error-get-notes"));
                let deviceId = getState().meta.deviceId;
                logsService.logError(
                    err, {
                        path: "action/index.js -> updateDatesAndNotes()",
                        date, preRenderDate, nextIndex
                    },
                    deviceId
                );
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
                dispatch(triggerErrorModal("error-common"));
                let deviceId = getState().meta.deviceId;
                logsService.logError(
                    err,
                    {
                        path: "action/index.js -> setSetting()",
                        settingName, value
                    },
                    deviceId
                );
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
export function triggerLoader (state) {
    return {
        type: "TRIGGER_LOADER",
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
                logsService.logError(
                    err,
                    {
                        path: "action/index.js -> getCount()",
                        date, period
                    },
                    deviceId
                );
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
                logsService.logError(
                    err,
                    {
                        path: "action/index.js -> getFullCount()",
                        date
                    },
                    deviceId
                );
            });
    }
}

// auth
export function googleSignIn() {
    return function(dispatch, getState) {
        dispatch(triggerLoader(true));

        return authService.googleSignIn()
            .then((user) => {
                dispatch(triggerLoader(false));

                return dispatch({
                    type: "RECEIVE_USER",
                    user
                })
            })
            .catch((err) => {
                dispatch(triggerLoader(false));

                dispatch(triggerErrorModal("error-sign-in", err.description));
                let deviceId = getState().meta.deviceId;
                logsService.logError(
                    err,
                    {
                        path: "action/index.js -> googleSignIn()",
                    },
                    deviceId
                );
            })
    }
}

export function googleSignOut() {
    return function(dispatch, getState) {
        dispatch(triggerLoader(true));

        return authService.googleSignOut()
            .then(() => {
                dispatch(triggerLoader(false));

                return dispatch({
                    type: "CLEAR_USER"
                })
            })
            .catch((err) => {
                dispatch(triggerLoader(false));

                dispatch(triggerErrorModal("error-sign-out"));
                let deviceId = getState().meta.deviceId;
                logsService.logError(
                    err,
                    {
                        path: "action/index.js -> googleSignOut()",
                    },
                    deviceId
                );
            })
    }
}

export function setToken(token) {
    return function(dispatch) {
        authService.setToken(token);
        return dispatch({
            type: "RECEIVE_USER",
            user: authService.getToken()
        });
    }
}

// backup

export function saveBackup() {
    return function (dispatch, getState) {
        let state = getState();
        if (state.user && state.user.settings.autoBackup) {
            dispatch(uploadGDBackup("auto"));
        } else {
            dispatch(saveLocalBackup());
        }
    }
}

export let uploadGDBackup = throttleAction(function (actionType) {
    return async function(dispatch, getState) {
        try {
            actionType === "user" && dispatch(triggerLoader(true));

            await backupService.uploadGDBackup({
                actionType: actionType
            });

            actionType === "user" && dispatch(updateGDBackupFiles());

            actionType === "user" && dispatch(triggerLoader(false));
        } catch(err) {
            dispatch(triggerLoader(false));
            dispatch(triggerErrorModal("error-backup-upload", err.description));
            let deviceId = getState().meta.deviceId;
            logsService.logError(err, {
                path: "action/index.js -> uploadGDBackup()",
                deviceId
            });
        }
    }
}, 5000);

export function restoreGDBackup(file) {
    return async function(dispatch, getState) {
        dispatch(triggerLoader(true));

        return backupService.restoreGDBackup(file)
            .then(() => {
                dispatch(triggerLoader(false));
                window.location.reload(true);
            })
            .catch((err) => {
                dispatch(triggerLoader(false));
                dispatch(triggerErrorModal("error-backup-restore", err.description));
                let deviceId = getState().meta.deviceId;
                logsService.logError(
                    err,
                    {
                        path: "action/index.js -> restoreGDBackup()",
                    },
                    deviceId
                );
            })
    }
}

export function updateGDBackupFiles() {
    return async function(dispatch, getState) {
        try {
            let token = getState().user;

            let nextToken = {
                ...token,
                gdBackup: {
                    backupFiles: await backupService.getGDBackupFiles()
                }
            };
            dispatch(setToken(nextToken));
        } catch(err) {
            let deviceId = getState().meta.deviceId;
            logsService.logError(
                err,
                {
                    path: "action/index.js -> updateGDBackupFiles()",
                },
                deviceId
            );
        }
    }
}

export function saveLocalBackup() {
    return async function(dispatch, getState) {
        try {
            let backupFiles = getState().backup.local;
            backupFiles.sort((a, b) => -(a.modifiedTime.diff(b.modifiedTime)));
            console.log(backupFiles)
            if (backupFiles.length > 2) {
                await backupService.saveLocalBackup(backupFiles[2]);
            } else {
                await backupService.saveLocalBackup();
            }
            dispatch(updateLocalBackupFiles());
        } catch(err) {
            let deviceId = getState().meta.deviceId;
            logsService.logError(
                err,
                {
                    path: "action/index.js -> saveLocalBackup()",
                },
                deviceId
            );
        }
    }
}

export function restoreLocalBackup(file) {
    return async function(dispatch, getState) {
        try {
            dispatch(triggerLoader(true));
            await backupService.restoreLocalBackup(file);
            dispatch(triggerLoader(false));
            window.location.reload(true);
        } catch(err) {
            let deviceId = getState().meta.deviceId;
            logsService.logError(
                err,
                {
                    path: "action/index.js -> restoreLocalBackup()",
                },
                deviceId
            );
        }
    }
}

export function updateLocalBackupFiles() {
    return async function(dispatch, getState) {
        try {
            let files = await backupService.getLocalBackups();
            dispatch({
                type: "SET_LOCAL_BACKUP_FILES",
                files
            });
        } catch(err) {
            let deviceId = getState().meta.deviceId;
            logsService.logError(
                err,
                {
                    path: "action/index.js -> updateLocalBackupFiles()",
                },
                deviceId
            );
        }
    }
}

// error modal
export function triggerErrorModal(message) {
    return {
        type: "TRIGGER_ERROR_MODAL",
        message
    }
}

// search
export function searchNotes(search, repeatType) {
    return function (dispatch, getState) {
        let state = getState();

        return notesService.searchNotes(state.settings.notesScreenMode, search, repeatType)
            .then((notes) => {
                dispatch({
                    type: "RECEIVE_SEARCH_NOTES",
                    notes
                })
            })
    }
}

export function resetSearch() {
    return {
        type: "RESET_SEARCH_NOTES",
    }
}