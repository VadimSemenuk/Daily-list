import notesService from "../services/notes.service";
import settingsService from "../services/settings.service";
import calendarService from "../services/calendar.service";
import authService from "../services/auth.service";
import backupService from "../services/backup.service";
import logsService from "../services/logs.service";

import {throttleAction} from "../utils/throttle";

import {NotesScreenMode} from "../constants";
import tagsService from "../services/tags.service";

// notes
export function addNote(note) {
    return async (dispatch) => {
        try {
            let addedNote = await notesService.addNote(note);

            dispatch({
                type: "RECEIVE_NOTE",
                payload: {
                    note: addedNote
                }
            });

            if (addedNote.mode === NotesScreenMode.WithDateTime) {
                dispatch(getFullCount());
            }

            dispatch(saveBackup());

            window.cordova && window.cordova.plugins.natives.updateWidgetList();
        } catch(err) {
            dispatch(triggerErrorModal("error-note-add"));
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
                window.device.uuid
            );
        }
    }
}

export function updateNote(data, originalNote, noteUpdateType) {
    return async (dispatch) => {
        try {
            let updatedNote = await notesService.updateNote(data, originalNote, noteUpdateType);

            if (updatedNote === null) {
                dispatch(updateNotes());

                dispatch(getFullCount());
            } else {
                dispatch({
                    type: "UPDATE_NOTE",
                    payload: {
                        nextNote: updatedNote,
                        originalNote: originalNote
                    }
                });

                if (updatedNote.mode === NotesScreenMode.WithDateTime) {
                    dispatch(getFullCount());
                }
            }

            dispatch(saveBackup());

            window.cordova && window.cordova.plugins.natives.updateWidgetList();
        } catch(err) {
            dispatch(triggerErrorModal("error-note-update"));
            logsService.logError(
                err,
                {
                    path: "action/index.js -> updateNote()",
                    note: {
                        ...data,
                        title: !!data.title,
                        contentItems: !!data.contentItems
                    },
                },
                window.device.uuid
            );
        }
    }
}

export function updateNoteDynamic(note, nextData) {
    return async (dispatch, getState) => {
        try {
            let nextNote = await notesService.updateNoteDynamic(note, nextData, getState().settings);

            dispatch({
                type: "UPDATE_NOTE_DYNAMIC",
                payload: {
                    notes: [nextNote],
                    fromShadowToReal: note.isShadow && !nextNote.isShadow
                }
            });

            if (nextData.hasOwnProperty('isFinished')) {
                if (nextNote.mode === NotesScreenMode.WithDateTime) {
                    dispatch(getFullCount());
                }
                dispatch(renderNotes());
            }

            dispatch(saveBackup());

            window.cordova && window.cordova.plugins.natives.updateWidgetList();
        } catch(err) {
            dispatch(triggerErrorModal("error-note-update"));
            logsService.logError(
                err,
                {
                    path: "action/index.js -> updateNoteDynamic()",
                    note: {
                        ...note,
                        title: !!note.title,
                        contentItems: !!note.contentItems
                    },
                },
                window.device.uuid
            );
        }
    }
}

export function moveNoteForDate(note, date) {
    return async (dispatch) => {
        try {
            let nextNote = await notesService.moveNoteForDate(note, date);

            dispatch({
                type: "UPDATE_NOTE_DYNAMIC",
                payload: {
                    notes: [nextNote],
                    fromShadowToReal: note.isShadow && !nextNote.isShadow
                }
            });

            if (nextNote.mode === NotesScreenMode.WithDateTime) {
                dispatch(getFullCount());
            }

            dispatch(saveBackup());

            window.cordova && window.cordova.plugins.natives.updateWidgetList();
        } catch(err) {
            dispatch(triggerErrorModal("error-note-update"));
            logsService.logError(
                err,
                {
                    path: "action/index.js -> moveNoteForTomorrow()",
                    note: {
                        ...note,
                        title: !!note.title,
                        contentItems: !!note.contentItems
                    },
                },
                window.device.uuid
            );
        }
    }
}

export function setNoteRepeatEndDate(note) {
    return async (dispatch) => {
        try {
            await notesService.setNoteRepeatEndDate(note);

            dispatch(updateNotes());

            dispatch(getFullCount());

            dispatch(saveBackup());

            window.cordova && window.cordova.plugins.natives.updateWidgetList();
        } catch(err) {
            dispatch(triggerErrorModal("error-note-update"));
            logsService.logError(
                err,
                {
                    path: "action/index.js -> moveNoteForTomorrow()",
                    note: {
                        ...note,
                        title: !!note.title,
                        contentItems: !!note.contentItems
                    },
                },
                window.device.uuid
            );
        }
    }
}

export function deleteNote(note) {
    return async (dispatch) => {
        try {
            let deletedNote = await notesService.deleteNote(note);

            dispatch({
                type: "DELETE_NOTE",
                payload: {
                    note: deletedNote
                }
            });

            if (deletedNote.mode === NotesScreenMode.WithDateTime) {
                dispatch(getFullCount());
            }

            dispatch(saveBackup());

            window.cordova && window.cordova.plugins.natives.updateWidgetList();
        } catch(err) {
            dispatch(triggerErrorModal("error-note-delete"));
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
                window.device.uuid
            );
        }
    }
}

export function getDeletedNotes() {
    return async (dispatch) => {
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
            logsService.logError(
                err,
                {
                    path: "action/index.js -> getDeletedNotes()",
                },
                window.device.uuid
            );
        }
    }
}

export function restoreNote(note) {
    return async (dispatch) => {
        try {
            let restoredNote = await notesService.restoreNote(note);

            dispatch({
                type: "RESTORE_NOTE",
                payload: {
                    note: restoredNote
                }
            });

            dispatch(getFullCount());

            dispatch(updateNotes());

            dispatch(saveBackup());

            window.cordova && window.cordova.plugins.natives.updateWidgetList();
        } catch(err) {
            dispatch(triggerErrorModal("error-note-restore"));
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
                window.device.uuid
            );
        }
    }
}

export function removeDeletedNotes() {
    return async (dispatch) => {
        try {
            await notesService.removeDeletedNotes();

            dispatch({
                type: "CLEAN_TRASH",
            });

            dispatch(saveBackup());
        } catch(err) {
            dispatch(triggerErrorModal("clean-trash-error"));
            logsService.logError(
                err,
                {
                    path: "action/index.js -> removeDeletedNotes()",
                },
                window.device.uuid
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
                    notes: insertedNotes,
                    fromShadowToReal: true
                }
            });

            window.cordova && window.cordova.plugins.natives.updateWidgetList();
        } catch(err) {
            dispatch(triggerErrorModal("reorder-fail"));
            logsService.logError(
                err,
                {
                    path: "action/index.js -> updateNotesManualSortIndex()",
                },
                window.device.uuid
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
            if (state.settings.notesScreenMode === NotesScreenMode.WithDateTime) {
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
            logsService.logError(
                err,
                {
                    path: "action/index.js -> updateNotes()",
                },
                window.device.uuid
            );
        }
    }
}

export function setDatesAndUpdateNotes(dates, dateIndex, notesScreenMode) {
    return async (dispatch) => {
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
            logsService.logError(
                err,
                {
                    path: "action/index.js -> setDatesAndUpdateNotes()",
                    dates, dateIndex
                },
                window.device.uuid
            );
        }
    }
}

export function updateDatesAndNotes(date, preRenderDate, nextIndex, notesScreenMode) {
    return async (dispatch) => {
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
            logsService.logError(
                err, {
                    path: "action/index.js -> updateDatesAndNotes()",
                    date, preRenderDate, nextIndex
                },
                window.device.uuid
            );
        }
    }
}

// settings
export function setSetting(nextSettings) {
    return async (dispatch) => {
        try {
            await settingsService.setSetting(nextSettings);

            await dispatch({
                type: "SET_SETTING",
                payload: {
                    nextSettings
                }
            });

            if (nextSettings.noteFilters) {
                dispatch(getFullCount());
            }

            if (["sortType", "sortDirection", "sortFinBehaviour", "lang", "password"].some((item) => nextSettings.hasOwnProperty(item))) {
                window.cordova && window.cordova.plugins.natives.updateWidget();
            }
        } catch(err) {
            dispatch(triggerErrorModal("error-common"));
            logsService.logError(
                err,
                {
                    path: "action/index.js -> setSetting()",
                    nextSettings
                },
                window.device.uuid
            );
        }
    }
}

// password
export function setPasswordCheckState() {
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
            let state = getState();
            let noteFilters = state.settings.noteFilters;
            let nextCount = await calendarService.getCount(date, period, noteFilters);

            dispatch({
                type: "GET_COUNT",
                payload: {
                    nextCount
                }
            });
        } catch(err) {
            logsService.logError(
                err,
                {
                    path: "action/index.js -> getCount()",
                    date, period
                },
                window.device.uuid
            );
        }
    }
}

export function getFullCount() {
    return async (dispatch, getState) => {
        try {
            let state = getState();
            let date = state.date.valueOf();
            let noteFilters = state.settings.noteFilters;
            let nextCount = await calendarService.getFullCount(date, noteFilters);
            dispatch({
                type: "GET_COUNT",
                payload: {
                    nextCount
                }
            });
        } catch(err) {
            logsService.logError(
                err,
                {
                    path: "action/index.js -> getFullCount()"
                },
                window.device.uuid
            );
        }
    }
}

// auth
export function googleSignIn() {
    return async (dispatch) => {
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
            logsService.logError(
                err,
                {
                    path: "action/index.js -> googleSignIn()",
                },
                window.device.uuid
            );
        }
    }
}

export function googleSignOut() {
    return async (dispatch) => {
        try {
            dispatch(triggerLoader(true));

            await authService.googleSignOut();
            dispatch(resetUser());

            dispatch(triggerLoader(false));
        } catch(err) {
            dispatch(triggerLoader(false));

            dispatch(triggerErrorModal("error-sign-out"));
            logsService.logError(
                err,
                {
                    path: "action/index.js -> googleSignOut()",
                },
                window.device.uuid
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

export function updateUserSettings(nextValue) {
    return (dispatch, getState) => {
        let state = getState();

        let nextUser = {
            ...state.user,
            settings: {
                ...state.user.settings,
                ...nextValue
            }
        };

        authService.setUser(nextUser);
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
    return async (dispatch) => {
        try {
            actionType === "user" && dispatch(triggerLoader(true));

            await backupService.uploadGDBackup({
                actionType: actionType
            });

            actionType === "user" && dispatch(updateGDBackupFiles());

            actionType === "user" && dispatch(triggerLoader(false));
        } catch(err) {
            dispatch(triggerLoader(false));
            if (actionType === "user") {
                dispatch(triggerErrorModal("error-backup-upload", err.description));
            }
            logsService.logError(err, {
                path: "action/index.js -> uploadGDBackup()",
            }, window.device.uuid);
        }
    }
}

export let uploadGDBackupThrottled = throttleAction(uploadGDBackup, 10000);

export function restoreGDBackup(file) {
    return async (dispatch) => {
        try {
            dispatch(triggerLoader(true));

            await backupService.restoreGDBackup(file);

            dispatch(triggerLoader(false));
            window.location.reload(true);
        } catch(err) {
            dispatch(triggerLoader(false));
            dispatch(triggerErrorModal("error-backup-restore", err.description));

            logsService.logError(
                err,
                {
                    path: "action/index.js -> restoreGDBackup()",
                },
                window.device.uuid
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
            logsService.logError(
                err,
                {
                    path: "action/index.js -> updateGDBackupFiles()",
                },
                window.device.uuid
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
export function searchNotes(search) {
    return async (dispatch, getState) => {
        let state = getState();

        let notes = await notesService.searchNotes(state.settings.notesScreenMode, search);

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

// sidenav
export function triggerSidenav() {
    return {
        type: "TRIGGER_SIDENAV",
    }
}

export function setSidenavItems(items) {
    return {
        type: "SET_SIDENAV_ITEMS",
        payload: {items}
    }
}

// tags
export function addTag(tag) {
    return async (dispatch) => {
        let id = await tagsService.addTag(tag);

        dispatch({
            type: "TAG_ADD",
            payload: {
                tag: {
                    ...tag,
                    id
                }
            }
        });
    }
}

export function updateTag(tag) {
    return async (dispatch) => {
        await tagsService.updateTag(tag);

        dispatch({
            type: "TAG_UPDATE",
            payload: {
                tag
            }
        });
    }
}

export function deleteTag(id) {
    return async (dispatch) => {
        let nextNoteFilters = await settingsService.deleteFilterTag(id);
        await dispatch({
            type: "SET_SETTING",
            payload: {
                nextSettings: {
                    noteFilters: nextNoteFilters
                }
            }
        });

        await notesService.deleteNotesTag(id);
        await dispatch(updateNotes());

        await tagsService.deleteTag(id);
        dispatch({
            type: "TAG_DELETE",
            payload: {
                id
            }
        });

        dispatch(getFullCount());
    }
}