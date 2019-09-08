import notesService from "../services/notes.service";
import settingsService from "../services/settings.service";
import calendarService from "../services/calendar.service";
import authService from "../services/auth.service";
import backupService from "../services/backup.service";

import {throttleAction} from "../utils/throttle";
import logsService from "../services/logs.service";

// notes
export function addNote(note) {
    return async (dispatch, getState) => {
        try {
            let addedNote = await notesService.addNote(note);

            dispatch({
                type: "RECEIVE_NOTE",
                payload: {
                    note: addedNote
                }
            });

            let state = getState();

            state.settings.calendarNotesCounter && dispatch(getFullCount(addedNote.added.valueOf()));

            dispatch(saveBackup());
        } catch(err) {
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
        }
    }
}

export function updateNote(note, prevNote) {
    return async (dispatch, getState) => {
        try {
            let updatedNote = await notesService.updateNote(note, prevNote);

            dispatch({
                type: "UPDATE_NOTE",
                payload: {
                    note: updatedNote,
                    prevNote: prevNote
                }
            });

            let state = getState();

            state.settings.calendarNotesCounter && dispatch(getFullCount(updatedNote.added.valueOf()));

            dispatch(saveBackup());
        } catch(err) {
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
        }
    }
}

export function updateNoteDynamicFields(note, updatedState) {
    return async (dispatch, getState) => {
        try {
            let updatedNote = await notesService.updateNoteDynamicFields(note, updatedState);

            dispatch({
                type: "UPDATE_NOTE",
                payload: {
                    note: updatedNote,
                    inserted: note.isShadow && !updatedNote.isShadow
                }
            });

            let state = getState();

            updatedState.hasOwnProperty('finished')
            && state.settings.calendarNotesCounter
            && !state.settings.calendarNotesCounterIncludeFinished
            && dispatch(getFullCount(updatedNote.added.valueOf()));

            updatedState.hasOwnProperty('finished') && dispatch(renderNotes());

            dispatch(saveBackup());
        } catch(err) {
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
        }
    }
}

export function updateNoteDate(note, nextDate) {
    return async (dispatch, getState) => {
        try {
            let updatedNote = await notesService.updateNoteDate(note, nextDate);

            dispatch({
                type: "UPDATE_NOTE",
                payload: {
                    note: updatedNote
                }
            });

            let state = getState();

            state.settings.calendarNotesCounter && dispatch(getFullCount(note.added.valueOf()));

            dispatch(renderNotes());

            dispatch(saveBackup());
        } catch(err) {
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
        }
    }
}

export function deleteNote(note) {
    return async (dispatch, getState) => {
        try {
            let deletedNote = await notesService.deleteNote(note);

            dispatch({
                type: "DELETE_NOTE",
                payload: {
                    note: deletedNote
                }
            });

            let state = getState();

            state.settings.calendarNotesCounter && dispatch(getFullCount(deletedNote.added.valueOf()));

            dispatch(saveBackup());
        } catch(err) {
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
        }
    }
}

export function getDeletedNotes() {
    return async (dispatch, getState) => {
        try {
            let items = await notesService.getDeletedNotes();

            dispatch({
                type: "RECEIVE_DELETED_NOTES",
                payload: {
                    items
                }
            });
        } catch(err) {
            dispatch(triggerErrorModal("error-note-get-trash"));
            let deviceId = getState().meta.deviceId;
            logsService.logError(
                err,
                {
                    path: "action/index.js -> getDeletedNotes()",
                },
                deviceId
            );
        }
    }
}

export function restoreNote(note) {
    return async (dispatch, getState) => {
        try {
            let restoredNote = await notesService.restoreNote(note);

            dispatch({
                type: "RESTORE_NOTE",
                payload: {
                    note: restoredNote
                }
            });

            let state = getState();

            state.settings.calendarNotesCounter && dispatch(getFullCount(state.date.valueOf()));
            dispatch(updateNotes());

            dispatch(saveBackup());
        } catch(err) {
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
        }
    }
}

export function cleanDeletedNotes() {
    return async (dispatch, getState) => {
        try {
            await notesService.cleanDeletedNotes();

            dispatch({
                type: "CLEAN_TRASH",
            });

            dispatch(saveBackup());
        } catch(err) {
            dispatch(triggerErrorModal("clean-trash-error"));
            let deviceId = getState().meta.deviceId;
            logsService.logError(
                err,
                {
                    path: "action/index.js -> cleanDeletedNotes()",
                },
                deviceId
            );
        }
    }
}

export function renderNotes () {
    return {
        type: "RENDER_NOTES"
    }
}

export function updateNotesManualSortIndex(notes) {
    return async (dispatch, getState) => {
        try {
            dispatch({
                type: "UPDATE_MANUAL_SORT_INDEX",
                payload: {
                    notes
                }
            });

            let insertedNotes = await notesService.updateNotesManualSortIndex(notes);
            dispatch({
                type: "UPDATE_NOTE",
                payload: {
                    notes: insertedNotes.map((insertedNote) => ({note: insertedNote, inserted: true}))
                }
            });
        } catch(err) {
            dispatch(triggerErrorModal("reorder-fail"));
            let deviceId = getState().meta.deviceId;
            logsService.logError(
                err,
                {
                    path: "action/index.js -> updateNotesManualSortIndex()",
                },
                deviceId
            );
        }
    }
}

// date
export function setCurrentDate (date) {
    return {
        type: "SET_CURRENT_DATE",
        payload: {
            date
        }
    }
}

export function updateNotes() {
    return async (dispatch, getState) => {
        try {
            let state = getState();

            let dates = null;
            if (state.settings.notesScreenMode === 1) {
                dates = state.notes.map((n) => n.date);
            }

            let notes = await notesService.getNotes(state.settings.notesScreenMode, dates);

            dispatch({
                type: "UPDATE_NOTES",
                payload: {
                    notes
                }
            })
        } catch(err) {
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
        }
    }
}

export function setDatesAndUpdateNotes(dates, dateIndex, notesScreenMode) {
    return async (dispatch, getState) => {
        try {
            let notes = await notesService.getNotes(notesScreenMode, dates);

            dispatch({
                type: "SET_DATES_AND_UPDATE_NOTES",
                payload: {
                    date: dates[dateIndex],
                    notes
                }
            })
        } catch(err) {
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
        }
    }
}

export function updateDatesAndNotes(date, preRenderDate, nextIndex, notesScreenMode) {
    return async (dispatch, getState) => {
        try {
            let notes = await notesService.getNotes(notesScreenMode, preRenderDate);

            dispatch({
                type: "UPDATE_DATES_AND_NOTES",
                payload: {
                    notes,
                    nextIndex,
                    date
                }
            })
        } catch(err) {
            dispatch(triggerErrorModal("error-get-notes"));
            let deviceId = getState().meta.deviceId;
            logsService.logError(
                err, {
                    path: "action/index.js -> updateDatesAndNotes()",
                    date, preRenderDate, nextIndex
                },
                deviceId
            );
        }
    }
}

// settings
export function setSetting(settingName, value, fn) {
    return async (dispatch, getState) => {
        try {
            await settingsService.setSetting(settingName, value);

            await dispatch({
                type: "SET_SETTING",
                payload: {
                    settingName,
                    value
                }
            });

            fn && fn();
        } catch(err) {
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
        }
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
        payload: {
            state
        }
    }
}

// calendar 
export function getCount (date, period) {
    return async (dispatch, getState) => {
        try {
            let includeFinished = getState().settings.calendarNotesCounterIncludeFinished;
            let nextCount = await calendarService.getCount(date, period, includeFinished);

            dispatch({
                type: "GET_COUNT",
                payload: {
                    nextCount
                }
            });
        } catch(err) {
            let deviceId = getState().meta.deviceId;
            logsService.logError(
                err,
                {
                    path: "action/index.js -> getCount()",
                    date, period
                },
                deviceId
            );
        }
    }
}

export function getFullCount (date) {
    return async (dispatch, getState) => {
        try {
            let includeFinished = getState().settings.calendarNotesCounterIncludeFinished;
            let nextCount = await calendarService.getFullCount(date, includeFinished);
            dispatch({
                type: "GET_COUNT",
                payload: {
                    nextCount
                }
            });
        } catch(err) {
            let deviceId = getState().meta.deviceId;
            logsService.logError(
                err,
                {
                    path: "action/index.js -> getFullCount()",
                    date
                },
                deviceId
            );
        }
    }
}

// auth
export function googleSignIn() {
    return async (dispatch, getState) => {
        try {
            dispatch(triggerLoader(true));

            let user = await authService.googleSignIn();

            dispatch(triggerLoader(false));

            return dispatch({
                type: "RECEIVE_USER",
                payload: {
                    user
                }
            })
        } catch(err) {
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
        }
    }
}

export function googleSignOut() {
    return async (dispatch, getState) => {
        try {
            dispatch(triggerLoader(true));

            await authService.googleSignOut();

            dispatch(triggerLoader(false));

            return dispatch({
                type: "CLEAR_USER"
            });
        } catch(err) {
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
        }
    }
}

export function setToken(token) {
    return (dispatch) => {
        authService.setToken(token);
        return dispatch({
            type: "RECEIVE_USER",
            payload: {
                user: authService.getToken()
            }
        });
    }
}

// backup
export function saveBackup() {
    return (dispatch, getState) => {
        let state = getState();
        if (state.user && state.user.settings.autoBackup) {
            dispatch(uploadGDBackup("auto"));
        } else {
            dispatch(saveLocalBackup());
        }
    }
}

export let uploadGDBackup = throttleAction((actionType) => {
    return async (dispatch, getState) => {
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
    return async (dispatch, getState) => {
        try {
            dispatch(triggerLoader(true));

            await backupService.restoreGDBackup(file);

            dispatch(triggerLoader(false));
            window.location.reload(true);
        } catch(err) {
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
        }
    }
}

export function updateGDBackupFiles() {
    return async (dispatch, getState) => {
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
    return async (dispatch, getState) => {
        try {
            let backupFiles = getState().backup.local;
            backupFiles.sort((a, b) => -(a.modifiedTime.diff(b.modifiedTime)));
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
    return async (dispatch, getState) => {
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
    return async (dispatch, getState) => {
        try {
            let files = await backupService.getLocalBackups();
            dispatch({
                type: "SET_LOCAL_BACKUP_FILES",
                payload: {
                    files
                }
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
        payload: {
            message
        }
    }
}

// search
export function searchNotes(search, repeatType) {
    return async (dispatch, getState) => {
        let state = getState();

        let notes = await notesService.searchNotes(state.settings.notesScreenMode, search, repeatType);

        dispatch({
            type: "RECEIVE_SEARCH_NOTES",
            payload: {
                notes
            }
        })
    }
}

export function resetSearch() {
    return {
        type: "RESET_SEARCH_NOTES",
    }
}