import notesService from "../services/notes.service";
import settingsService from "../services/settings.service";
import calendarService from "../services/calendar.service";
import authService from "../services/auth.service";
import backupService from "../services/backup.service";
import logsService from "../services/logs.service";

import {throttleAction} from "../utils/throttle";

import {NotesScreenMode} from "../constants";

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

            state.settings.calendarNotesCounter && dispatch(getFullCount(addedNote.date.valueOf()));

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
                        contentItems: !!note.contentItems
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

            state.settings.calendarNotesCounter && dispatch(getFullCount(updatedNote.date.valueOf()));

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
                        contentItems: !!note.contentItems
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
                type: "UPDATE_NOTE_DYNAMIC",
                payload: {
                    notes: [updatedNote],
                }
            });

            let state = getState();

            updatedState.hasOwnProperty('isFinished')
            && state.settings.calendarNotesCounter
            && !state.settings.calendarNotesCounterIncludeFinished
            && dispatch(getFullCount(updatedNote.date.valueOf()));

            updatedState.hasOwnProperty('isFinished') && dispatch(renderNotes());

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
                        contentItems: !!note.contentItems
                    },
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

            state.settings.calendarNotesCounter && dispatch(getFullCount(deletedNote.date.valueOf()));

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
                        contentItems: !!note.contentItems
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
                        contentItems: !!note.contentItems
                    },
                },
                deviceId
            );
        }
    }
}

export function removeDeletedNotes() {
    return async (dispatch, getState) => {
        try {
            await notesService.removeDeletedNotes();

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
                    path: "action/index.js -> removeDeletedNotes()",
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
                type: "SET_NOTES_LIST_ITEMS",
                payload: {
                    notes,
                    date: getState().date
                }
            });

            let insertedNotes = await notesService.updateNotesManualSortIndex(notes);
            dispatch({
                type: "UPDATE_NOTE_DYNAMIC",
                payload: {
                    notes: insertedNotes
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
export function updateNotes() {
    return async (dispatch, getState) => {
        try {
            let state = getState();

            let dates = null;
            if (state.settings.notesScreenMode === NotesScreenMode.WithTime) {
                dates = state.notes.map((n) => n.date);
            }

            let notes = await notesService.getNotes(state.settings.notesScreenMode, dates);

            dispatch({
                type: "UPDATE_NOTES_LIST",
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
            let notes = (await notesService.getNotes(notesScreenMode, preRenderDate))[0];

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
export function setPasswordCheckState(value) {
    return {
        type: "SET_PASSWORD_CHECK_STATE",
        payload: {
            value: true
        }
    }
}

// loader
export function triggerLoader(state) {
    return {
        type: "TRIGGER_LOADER",
        payload: {
            state
        }
    }
}

// calendar 
export function getCount(date, period) {
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

export function getFullCount(date) {
    return async (dispatch, getState) => {
        try {
            let state = getState();
            date = state.date.valueOf();
            let includeFinished = state.settings.calendarNotesCounterIncludeFinished;
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
            dispatch(setUser(user));
            dispatch(updateGDBackupFiles());

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
            dispatch(resetUser());

            dispatch(triggerLoader(false));
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

export function setUser(user) {
    return (dispatch) => {
        authService.setUser(user);
        return dispatch({
            type: "RECEIVE_USER",
            payload: {
                user: authService.getUser()
            }
        });
    }
}

export function resetUser() {
    return (dispatch) => {
        authService.resetUser();
        return dispatch({
            type: "CLEAR_USER",
            payload: {
                user: authService.getUser()
            }
        });
    }
}

// backup
export function saveBackup() {
    return (dispatch, getState) => {
        let state = getState();
        if (state.user && state.user.settings.autoBackup) {
            dispatch(uploadGDBackupThrottled("auto"));
        }
    }
}

export function uploadGDBackup(actionType) {
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
}

export let uploadGDBackupThrottled = throttleAction(uploadGDBackup, 30000);

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
            let user = getState().user;

            let nextUser = {
                ...user,
                gdBackup: {
                    backupFiles: await backupService.getGDBackupFiles()
                }
            };
            dispatch(setUser(nextUser));
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