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
                token && token.settings.autoBackup && dispatch(uploadBackup(note, token, null, true));
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

export function updateNote (note, prevNote, updateCount) {
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
                updateCount && dispatch(getFullCount(note.added.valueOf()));

                let token = getState().user;
                token && token.settings.autoBackup && dispatch(uploadBackup(note, token, true, true));
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

                updatedState.finished !== undefined
                && state.settings.calendarNotesCounter
                && !state.settings.calendarNotesCounterIncludeFinished
                && dispatch(getFullCount(nextNote.added.valueOf()));

                state.finished !== undefined && dispatch(renderNotes());

                let token = state.user;
                token && token.settings.autoBackup && dispatch(uploadBackup(nextNote, token, null, true));
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

export function updateNoteDate (note, nextDate, updateCount) {
    return function(dispatch, getState) {
        return notesService.updateNoteDate(note, nextDate)
            .then((nextNote) => dispatch({
                type: "UPDATE_NOTE",
                note: nextNote
            }))
            .then(({note}) => {
                updateCount && dispatch(getFullCount(note.added.valueOf()));
                dispatch(renderNotes());

                let token = getState().user;
                token && token.settings.autoBackup && dispatch(uploadBackup(note, token, null, true));
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
                token && token.settings.autoBackup && dispatch(uploadBackup(note, token, null, true));
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
                token && token.settings.autoBackup && dispatch(uploadBackup(note, token, null, true));
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

        return notesService.cleanDeletedNotes()
            .then(() => dispatch({
                type: "CLEAN_TRASH",
            }))
            .then(() => {
                let token = state.user;
                token && token.settings.autoBackup && dispatch(uploadBatchBackup());
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
                dispatch(triggerErrorModal("error-common"));
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
                dispatch(triggerLoader());

                return dispatch({
                    type: "RECIVE_USER",
                    user
                })
            })
            .catch((err) => {
                dispatch(triggerErrorModal("error-sign-in", err.description));
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
export function uploadBackup(note, token, removeForkNotes, inBackground) {
    return function(dispatch, getState) {
        if (!token) {
            token = getState().user;
        }

        return debouncedUploadBackup(note, token, removeForkNotes, inBackground, dispatch, getState);
    }
}
let debouncedUploadBackup = throttle(async (note, token, removeForkNotes, inBackground, dispatch, getState) => {
    try {
        !inBackground && dispatch(triggerLoader());

        let msBackupStartTime = moment.valueOf();
        let noteForBackup = await notesService.getNoteForBackup(note.key);
        if (!noteForBackup[0]) {
            return
        }
        await backupService.uploadNoteBackup(noteForBackup[0], token, removeForkNotes);
        await notesService.setNoteBackupState(note.key, true, true, msBackupStartTime);
        let nextToken = {
            ...token,
            backup: {
                ...token.backup,
                lastBackupTime: moment()
            }
        };
        dispatch(setToken(nextToken));

        !inBackground && dispatch(triggerLoader());
    } catch(err) {
        !inBackground && dispatch(triggerErrorModal("error-backup-upload", err.description));
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
    }
}, 500);

export function uploadBatchBackup(inBackground) {
    return async function(dispatch, getState) {
        !inBackground && dispatch(triggerLoader());

        let token = getState().user;

        try {
            let msBackupStartTime = moment.valueOf();
            let notes = await notesService.getNoteForBackup();
            if (!notes) {
                return
            }
            await backupService.uploadNotesBatchBackup(notes, token);
            await notesService.removeClearedNotes(msBackupStartTime);
            await notesService.setNoteBackupState(null, true, true, msBackupStartTime);
            let nextToken = {
                ...token,
                backup: {
                    ...token.backup,
                    lastBackupTime: moment()
                }
            };
            dispatch(setToken(nextToken));

            !inBackground && dispatch(triggerLoader());
        } catch(err) {
            !inBackground && dispatch(triggerLoader());
            !inBackground && dispatch(triggerErrorModal("error-backup-upload", err.description));
            let deviceId = getState().meta.deviceId;
            deviceService.logError(err, {
                path: "action/index.js -> uploadBatchBackup()",
                deviceId
            });
        }
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
                dispatch(triggerErrorModal("error-backup-restore", err.description));
                let deviceId = getState().meta.deviceId;
                deviceService.logError(err, {
                    path: "action/index.js -> restoreBackup()",
                    deviceId
                });
            })
    }
}

export function updateLastBackupTime(nextTime) {
    return async function(dispatch, getState) {
        try {
            let token = getState().user;

            if (!nextTime) {
                dispatch(triggerLoader());

                nextTime = await backupService.getUserLastBackupTime(token);

                dispatch(triggerLoader());
            }

            if (nextTime) {
                let nextToken = {
                    ...token,
                    backup: {
                        ...token.backup,
                        lastBackupTime: moment(nextTime)
                    }
                };
                dispatch(setToken(nextToken));
            }
        } catch(err) {
            dispatch(triggerLoader(null, false));

            let deviceId = getState().meta.deviceId;
            deviceService.logError(err, {
                path: "action/index.js -> updateLastBackupTime()",
                deviceId
            });
        }
    }
}

// meta
export function setBackupMigrationState(state) {
    return function(dispatch) {
        return deviceService.setBackupMigrationState(state)
            .then(() => {
                dispatch({
                    type: "SET_BACKUP_MIGRATION_STATE",
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