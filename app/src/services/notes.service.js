import executeSQL from '../utils/executeSQL';
import moment from 'moment';
import {
    NoteAction,
    NoteContentItemType,
    NoteMode,
    NoteRepeatType,
    NoteUpdateType,
} from "../constants";
import tagsService from "./tags.service";
import {convertUTCDateTimeToLocal, convertLocalDateTimeToUTC} from "../utils/convertDateTimeLocale";
import notificationService from "./notification.service";

class NotesService {
    // region parse note
    parseNoteCommon(note) {
        return {
            contentItems: JSON.parse(note.contentItems),
            isFinished: Boolean(note.isFinished),
            lastActionTime: moment(note.lastActionTime),
            tags: (note.tags ? note.tags.split(",") : []).map((id) => tagsService.tags[id])
        }
    }

    parseNoteWithTime(note) {
        return {
            ...note,
            ...this.parseNoteCommon(note),
            startTime: note.startTime ? convertUTCDateTimeToLocal(note.startTime, "second") : note.startTime,
            endTime: note.endTime ? convertUTCDateTimeToLocal(note.endTime, "second") : note.endTime,
            date: note.date ? convertUTCDateTimeToLocal(note.date) : note.date,
            isNotificationEnabled: Boolean(note.isNotificationEnabled),
            isShadow: Boolean(note.date === null),
            repeatValues: note.repeatValues ? note.repeatValues.split(",").map(a => note.repeatType === NoteRepeatType.Any ? convertUTCDateTimeToLocal(Number(a)).valueOf() : Number(a)) : [],
            repeatItemDate: note.repeatItemDate ? convertUTCDateTimeToLocal(note.repeatItemDate) : note.repeatItemDate
        };
    }

    parseNoteWithoutTime(note) {
        return {
            ...note,
            ...this.parseNoteCommon(note)
        }
    }
    // endregion

    // region search note
    async processSearchResultNotesWithTime(notesIDs) {
        let currentDate = moment().startOf("day");

        let select = await executeSQL(
            `SELECT n.id, n.title, n.startTime, n.endTime, n.isNotificationEnabled, n.tag, n.tags,
                        n.repeatType, n.contentItems, n.isFinished, n.forkFrom, n.date, n.manualOrderIndex, n.mode,
                        (select GROUP_CONCAT(rep.value, ',') from NotesRepeatValues rep where rep.noteId = n.id OR rep.noteId = n.forkFrom) as repeatValues
                        FROM Notes n
                        WHERE
                            n.id IN (${notesIDs.join(',')})
                            AND n.mode == ?
                            AND n.lastAction != ?`
            , [NoteMode.WithDateTime, NoteAction.Delete]);

        if (!select.rows.length) {
            return [];
        }

        let findClosestValue = (initialValue, data) => {
            let reducer = (closest, value) => {
                if (
                    closest === null ||
                    Math.abs(initialValue - value) < Math.abs(initialValue - closest)
                ) {
                    return value;
                }
                return closest;
            };
            return data.reduce(reducer, null);
        }

        let notes = [];
        for(let i = 0; i < select.rows.length; i++) {
            let note = this.parseNoteWithTime(select.rows.item(i));

            if (note.repeatType === NoteRepeatType.Day) {
                note.date = moment(currentDate);
            } else if (note.repeatType === NoteRepeatType.Week) {
                note.date = moment().startOf("day").isoWeekday(findClosestValue(moment(currentDate).isoWeekday(), note.repeatValues));
            } else if (note.repeatType === NoteRepeatType.Any) {
                note.date = findClosestValue(currentDate.valueOf(), note.repeatValues);
            }
            notes.push(note);
        }

        let closestToCurrentDateNoteDateDiff = null;
        let closestToCurrentDateNoteIndex = 0;
        let closestToCurrentDate = null;
        let msCurrentDate = currentDate.valueOf();
        notes.forEach((note, index) => {
            let dateDiff = Math.abs(msCurrentDate - note.date.valueOf());
            if ((dateDiff < closestToCurrentDateNoteDateDiff) || (closestToCurrentDateNoteDateDiff === null)) {
                closestToCurrentDateNoteDateDiff = dateDiff;
                closestToCurrentDateNoteIndex = index;
                closestToCurrentDate = note.date.valueOf();
            }
        });

        notes = notes.slice(closestToCurrentDateNoteIndex - 50, closestToCurrentDateNoteIndex).concat(notes.slice(closestToCurrentDateNoteIndex, closestToCurrentDateNoteIndex + 50));

        let notesByDates = {};
        notes.forEach((note) => {
            let msDate = note.date.valueOf();
            if (!notesByDates[msDate]) {
                notesByDates[msDate] = [];
            }
            notesByDates[msDate].push(note);
        });

        return Object.keys(notesByDates)
            .map((date) => ({
                date: moment(+date),
                items: notesByDates[date],
                isClosestToCurrentDate: +date === +closestToCurrentDate
            }))
            .sort((a, b) => {
                return a.date.valueOf() - b.date.valueOf();
            });
    }

    async processSearchResultNotesWithoutTime(notesIds) {
        let select = await executeSQL(
            `SELECT n.id, n.title, n.startTime, n.endTime, n.isNotificationEnabled, n.tag, n.tags,
                        n.repeatType, n.contentItems, n.isFinished, n.forkFrom, n.date, n.manualOrderIndex, n.mode
                        FROM Notes n
                        WHERE
                            n.id IN (${notesIds.join(',')})
                            AND n.mode == ?
                            AND n.lastAction != ?`
            , [NoteMode.WithoutDateTime, NoteAction.Delete]);

        let notes = [];
        for(let i = 0; i < select.rows.length; i++) {
            notes.push(this.parseNoteWithoutTime(select.rows.item(i)));
        }

        return [{items: notes}];
    }

    async searchNotes(mode, search) {
        search = search.toLowerCase().trim();

        if (!search) {
            return [];
        }

        let allNotesSelect = await executeSQL(
            `SELECT n.id, n.title, n.contentItems 
            FROM Notes n
            WHERE n.forkFrom IS NULL;`,
        );
        let filteredNotesIDs = [];
        for(let i = 0; i < allNotesSelect.rows.length; i++) {
            let item = allNotesSelect.rows.item(i);

            if (item.title && item.title.toLowerCase().includes(search)) {
                filteredNotesIDs.push(item.id);
                continue;
            }

            if (item.contentItems && item.contentItems.toLowerCase().includes(search)) {
                let contentItems = JSON.parse(item.contentItems);
                if (contentItems.some((f) => f.value && f.value.toLowerCase().includes(search))) {
                    filteredNotesIDs.push(item.id);
                }
            }
        }

        if (mode === NoteMode.WithDateTime) {
            return this.processSearchResultNotesWithTime(filteredNotesIDs);
        } else {
            return this.processSearchResultNotesWithoutTime(filteredNotesIDs);
        }
    }
    // endregion

    // region query notes
    async getNotesWithTime(dates) {
        let selects = await Promise.all(
            dates.map((date) => {
                let msDateUTC = convertLocalDateTimeToUTC(date).valueOf();
                let msDateUTCDayEnd = convertLocalDateTimeToUTC(date).endOf("day").valueOf();

                return executeSQL(
                    `SELECT n.id, n.title, n.startTime, n.endTime, n.isNotificationEnabled, n.tag, n.repeatType, n.tags, n.contentItems, 
                    n.isFinished, n.forkFrom, n.manualOrderIndex, n.date, n.mode, n.lastAction, n.lastActionTime, n.repeatItemDate, n.repeatEndDate,
                    (select GROUP_CONCAT(rep.value, ',') from NotesRepeatValues rep where rep.noteId = n.id OR rep.noteId = n.forkFrom) as repeatValues
                    FROM Notes n
                    LEFT JOIN NotesRepeatValues rep ON n.id = rep.noteId
                    WHERE
                        n.lastAction != ?
                        AND (
                            (n.date >= ? AND n.date <= ?)
                            OR (
                                n.date IS NULL
                                AND n.repeatStartDate <= ? AND (n.repeatEndDate IS NULL OR n.repeatEndDate >= ?) 
                                AND NOT EXISTS (SELECT forkFrom FROM Notes WHERE forkFrom = n.id AND (repeatItemDate >= ? AND repeatItemDate <= ?))
                                AND (
                                    n.repeatType = ?
                                    OR (n.repeatType = ? AND rep.value = ?)
                                    OR (n.repeatType = ? AND (rep.value >= ? AND rep.value <= ?))
                                )
                            )
                        )
                        AND n.mode == ?;`,
                    [NoteAction.Delete, msDateUTC, msDateUTCDayEnd, msDateUTC, msDateUTC, msDateUTC, msDateUTCDayEnd, NoteRepeatType.Day, NoteRepeatType.Week, date.isoWeekday(), NoteRepeatType.Any, msDateUTC, msDateUTCDayEnd, NoteMode.WithDateTime]
                );
            })
        );

        let result = selects.map((select, selectIndex) => {
            let notes = [];
            for(let i = 0; i < select.rows.length; i++) {
                let note = this.parseNoteWithTime(select.rows.item(i));
                note.date = moment(dates[selectIndex].valueOf());
                notes.push(note);
            }

            return {
                date: dates[selectIndex],
                items: notes
            }
        });

        return result;
    }

    async getNotesWithoutTime() {
        let select = await executeSQL(
            `SELECT id, title, tag, contentItems, manualOrderIndex, mode, isFinished, lastAction, lastActionTime, 
            repeatType, forkFrom, tags
            FROM Notes
            WHERE
                mode == ?
                AND lastAction != ?`,
            [NoteMode.WithoutDateTime, NoteAction.Delete]
        );

        let notes = [];
        for(let i = 0; i < select.rows.length; i++) {
            notes.push(this.parseNoteWithoutTime(select.rows.item(i)));
        }

        return [{ items: notes }];
    }

    async getNotes(mode, dates) {
        if (mode === NoteMode.WithDateTime) {
            return this.getNotesWithTime(dates);
        } else {
            return this.getNotesWithoutTime();
        }
    }

    async getNote(id) {
        let select = executeSQL(
            `SELECT n.id, n.title, n.startTime, n.endTime, n.isNotificationEnabled, n.tag, n.repeatType, n.tags, n.contentItems, 
            n.isFinished, n.forkFrom, n.manualOrderIndex, n.date, n.mode, n.lastAction, n.lastActionTime, n.repeatItemDate, n.repeatEndDate,
            (select GROUP_CONCAT(rep.value, ',') from NotesRepeatValues rep where rep.noteId = n.id OR rep.noteId = n.forkFrom) as repeatValues
            FROM Notes n
            WHERE id = ?`,
            [id]
        );

        if (select.rows.length === 0) {
            return null;
        }

        let note = select.rows.item(0);
        return note.mode === NoteMode.WithDateTime ? this.parseNoteWithTime(note) : this.parseNoteWithoutTime(note);
    }
    // endregion

    // region add note
    async addNote(note) {
        let nextNote = {
            ...note,
            isFinished: false,
            forkFrom: null,
            isShadow: note.repeatType !== NoteRepeatType.NoRepeat,
            manualOrderIndex: null,
            repeatItemDate: null
        };

        nextNote = this.getNoteRepeatStartEndTime(nextNote);
        nextNote = this.parseNoteValues(nextNote);

        let noteId = await this.insertNote(nextNote);
        nextNote.id = noteId;

        nextNote = await this.updateNoteLastAction(NoteAction.Add, nextNote);

        await this.addNoteRepeatValues(nextNote);

        notificationService.schedule(nextNote.id);

        return nextNote;
    }

    getNoteRepeatStartEndTime(note) {
        let nextNote = {...note};

        if (nextNote.repeatType === NoteRepeatType.NoRepeat) {
            nextNote.repeatStartDate = null;
            nextNote.repeatEndDate = null;
        } else {
            if (nextNote.repeatType === NoteRepeatType.Any) {
                let repeatValues = note.repeatValues.sort();
                nextNote.repeatStartDate = convertLocalDateTimeToUTC(repeatValues[0]);
                nextNote.repeatEndDate = convertLocalDateTimeToUTC(repeatValues[repeatValues.length - 1]);
            } else {
                nextNote.repeatStartDate = moment().startOf("day");
                nextNote.repeatEndDate = null;
            }
        }

        return nextNote;
    }

    async insertNote(note) {
        let insert = await executeSQL(
            `INSERT INTO Notes
            (title, startTime, endTime, isNotificationEnabled, tag, repeatType, contentItems, isFinished, date, forkFrom, mode, manualOrderIndex, tags, repeatItemDate, repeatStartDate, repeatEndDate)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
                note.title,
                note.startTime ? convertLocalDateTimeToUTC(note.startTime, "second").valueOf() : note.startTime,
                note.endTime ? convertLocalDateTimeToUTC(note.endTime, "second").valueOf() : note.endTime,
                Number(note.isNotificationEnabled),
                note.tag,
                note.repeatType,
                JSON.stringify(note.contentItems),
                Number(note.isFinished),
                note.date ? convertLocalDateTimeToUTC(note.date).valueOf() : note.date,
                note.forkFrom,
                note.mode,
                note.manualOrderIndex,
                note.tags.map((tag) => tag.id).join(","),
                note.repeatItemDate ? convertLocalDateTimeToUTC(note.repeatItemDate).valueOf() : note.repeatItemDate,
                note.repeatStartDate ? convertLocalDateTimeToUTC(note.repeatStartDate).valueOf() : note.repeatStartDate,
                note.repeatEndDate ? convertLocalDateTimeToUTC(note.repeatEndDate).valueOf() : note.repeatEndDate,
            ]
        );

        return insert.insertId;
    }

    async addNoteRepeatValues(note) {
        await executeSQL(`DELETE FROM NotesRepeatValues WHERE noteId = ?`, [ note.id ]);

        if (note.repeatType === NoteRepeatType.NoRepeat || note.repeatValues.length === 0) {
            return
        }

        let params = note.repeatValues.reduce((acc) => `${acc}, (?, ?)`, "");
        params = params.slice(2);
        let values = note.repeatValues.reduce((acc, value) => {
            if (note.repeatType === NoteRepeatType.Any) {
                value = convertLocalDateTimeToUTC(value).valueOf();
            }
            return [...acc, note.id, value]
        }, []);

        await executeSQL(`
            INSERT INTO NotesRepeatValues
            (noteId, value)
            VALUES
            ${params};
        `, values);
    }
    // endregion

    // region updates note
    async updateNote(data, originalNote, noteUpdateType) {
        let nextNote = {...originalNote, ...data};
        nextNote = this.parseNoteValues(nextNote);

        if (noteUpdateType === NoteUpdateType.NO_REPEAT) {
            // reset manualOrderIndex on date change
            if (!nextNote.date.isSame(originalNote.date)) {
                nextNote = await this.resetNoteManualOrderIndex(nextNote);
            }
            await update(nextNote.id, nextNote, true);

            nextNote = await this.updateNoteLastAction(NoteAction.Edit, nextNote);

            notificationService.clear(nextNote.id);
            notificationService.schedule(nextNote.id);

            return nextNote;
        } else if (noteUpdateType === NoteUpdateType.REPEAT_TYPE_CHANGE) {
            if (originalNote.repeatType === NoteRepeatType.NoRepeat) {
                // remove initial note
                await executeSQL(`DELETE FROM Notes WHERE id = ?`, [originalNote.id]);
                notificationService.clear(originalNote.id);
            } else {
                // remove shadow note and forked not-finished, set forked finished as no-repeat
                let shadowNoteId = originalNote.isShadow ? originalNote.id : originalNote.forkFrom;
                await executeSQL(`DELETE FROM Notes WHERE id = ? OR (forkFrom = ? AND isFinished = ?)`, [shadowNoteId, shadowNoteId, Number(false)]);
                await executeSQL(`DELETE FROM NotesRepeatValues WHERE noteId = ?`, [shadowNoteId]);
                notificationService.clear(shadowNoteId);

                // make finished forked notes no-repeat
                await executeSQL(
                    `UPDATE Notes 
                    SET repeatType = ?, forkFrom = ?, repeatItemDate = ?
                    WHERE forkFrom = ? AND isFinished = ?`,
                    [NoteRepeatType.NoRepeat, null, null, shadowNoteId, Number(true)]
                );
                // TODO: set notifications for future dates
            }

            // add new note
            nextNote = await this.addNote(nextNote);
            await this.updateNoteLastAction(NoteAction.Edit, nextNote);

            return null;
        } else if (noteUpdateType === NoteUpdateType.REPEAT_ALL) {
            let shadowNoteId = nextNote.isShadow ? nextNote.id : nextNote.forkFrom;

            // update all repeat notes
            await update(shadowNoteId, nextNote, false);

            // TODO: update note last action

            notificationService.clear(shadowNoteId);
            notificationService.schedule(shadowNoteId);

            return null;
        } else if (noteUpdateType === NoteUpdateType.REPEAT_CURRENT) {
            nextNote.date = moment(originalNote.date);

            if (originalNote.isShadow) {
                nextNote = await this.fromShadowToReal(nextNote);
            } else {
                await update(nextNote.id, nextNote, false);
            }

            nextNote = await this.updateNoteLastAction(NoteAction.Edit, nextNote);

            notificationService.clear(nextNote.forkFrom);
            notificationService.schedule(nextNote.forkFrom);

            return nextNote;
        }

        function update(id, note, updateDate) {
            return executeSQL(
                `UPDATE Notes
                        SET title = ?, contentItems = ?,${updateDate ? " date = ?," : ""} startTime = ?, endTime = ?, isNotificationEnabled = ?, 
                        repeatType = ?, tag = ?, tags = ?
                        WHERE id = ? OR forkFrom = ?;`,
                [
                    note.title,
                    JSON.stringify(note.contentItems),
                    ...(updateDate ? [note.date ? convertLocalDateTimeToUTC(note.date, "second").valueOf() : note.date] : []),
                    note.startTime ? convertLocalDateTimeToUTC(note.startTime, "second").valueOf() : note.startTime,
                    note.endTime ? convertLocalDateTimeToUTC(note.endTime, "second").valueOf() : note.endTime,
                    Number(note.isNotificationEnabled),
                    note.repeatType,
                    note.tag,
                    note.tags.map((tag) => tag.id).join(","),
                    id,
                    id
                ]
            );
        }
    }

    async moveNoteForDate(note, date) {
        let nextNote = {...note};

        if (nextNote.isShadow) {
            nextNote = await this.fromShadowToReal(nextNote);
        }

        nextNote = {
            ...nextNote,
            date: moment(date),
            manualOrderIndex: null
        }

        await executeSQL(
            `UPDATE Notes
            SET date = ?, manualOrderIndex = ?
            WHERE id = ?;`,
            [
                convertLocalDateTimeToUTC(nextNote.date).valueOf(),
                nextNote.manualOrderIndex,
                nextNote.id
            ]
        );

        nextNote = await this.updateNoteLastAction(NoteAction.Edit, nextNote);

        notificationService.schedule(nextNote.isShadow ? nextNote.forkFrom : nextNote.id);

        return nextNote;
    }

    async triggerNoteFinishState(note, resetManualOrderIndex) {
        let nextNote = {...note, isFinished: !note.isFinished};

        if (nextNote.isShadow) {
            nextNote = await this.fromShadowToReal(nextNote);
        }

        if (resetManualOrderIndex) {
            nextNote = await this.resetNoteManualOrderIndex(nextNote);
        }

        await executeSQL(
            `UPDATE Notes SET isFinished = ? WHERE id = ?;`,
            [Number(nextNote.isFinished), nextNote.id]
        );

        nextNote = await this.updateNoteLastAction(NoteAction.Edit, nextNote);

        return nextNote;
    }

    async updateNoteContentItems(note, nextContentItems) {
        let nextNote = {...note, contentItems: nextContentItems};

        if (nextNote.isShadow) {
            nextNote = await this.fromShadowToReal(nextNote);
        }

        await executeSQL(
            `UPDATE Notes SET contentItems = ? WHERE id = ?;`,
            [JSON.stringify(nextNote.contentItems), nextNote.id]
        );

        nextNote = await this.updateNoteLastAction(NoteAction.Edit, nextNote);

        return nextNote;
    }

    async updateNotesManualSortIndex(notes) {
        let nextNotes = notes.slice();
        let notesInserted = [];
        for (let note of nextNotes) {
            if (note.isShadow) {
                note = await this.fromShadowToReal(note);
                notesInserted.push(note);
            }
        }

        const values = notes.reduce((acc, val) => [...acc, val.id, val.manualOrderIndex], []);
        const valuesPlaces = notes.reduce((acc) => [...acc, '(?, ?)'], []).join(", ");

        let sql = `
            WITH Tmp (id, manualOrderIndex) AS (VALUES ${valuesPlaces})
            UPDATE Notes SET manualOrderIndex = (SELECT manualOrderIndex FROM Tmp WHERE Notes.id = Tmp.id) WHERE id IN (SELECT id FROM Tmp);
        `;
        await executeSQL(sql, values);

        return notesInserted;
    }

    async resetNoteManualOrderIndex(note) {
        let nextNote = {
            ...note,
            manualOrderIndex: null
        };

        await executeSQL(
            `UPDATE Notes
            SET manualOrderIndex = ?
            WHERE id = ? OR forkFrom = ?;`,
            [nextNote.manualOrderIndex, nextNote.id, nextNote.id]
        );

        return nextNote;
    }

    async setNoteRepeatEndDate(note) {
        let id = note.forkFrom || note.id;
        let dateUTCMS = convertLocalDateTimeToUTC(note.date).valueOf();
        await executeSQL(`UPDATE Notes SET repeatEndDate = ? WHERE id = ?`, [dateUTCMS, id]);
        await executeSQL(`DELETE FROM Notes WHERE forkFrom = ? AND date > ?`, [id, dateUTCMS]);

        notificationService.schedule(id);
    }

    async deleteNotesTag(tagId) {
        let select = await executeSQL(`SELECT id, tags FROM Notes;`);

        let nextNotes = [];
        for(let i = 0; i < select.rows.length; i++) {
            let note = select.rows.item(i);
            if (note.tags && note.tags.split(",").filter((_tagId) => Number(_tagId) === tagId).length > 0) {
                note.tags = note.tags.split(",").filter((_tagId) => Number(_tagId) !== tagId).join(",");
                nextNotes.push(note);
            }
        }

        if (nextNotes.length) {
            await executeSQL(`
                UPDATE Notes
                SET tags = CASE id
                    ${nextNotes.map((note) => `WHEN ${note.id} THEN "${note.tags}"`).join(" ")}
                    ELSE tags
                END
                WHERE id IN(${nextNotes.map((note) => note.id).join(",")});
            `);
        }
    }

    async updateNoteLastAction(actionType, note) {
        let nextNote = {
            ...note,
            lastAction: actionType,
            lastActionTime: moment().valueOf()
        };

        await executeSQL(`
            UPDATE Notes
            SET
                lastAction = ?,
                lastActionTime = ?
            WHERE id = ? OR forkFrom = ?;
        `,
            [
                nextNote.lastAction,
                nextNote.lastActionTime,
                nextNote.id,
                nextNote.id
            ]
        );

        return nextNote;
    }

    async fromShadowToReal(note) {
        let nextNote = {
            ...note,
            forkFrom: note.id,
            isShadow: false,
            repeatItemDate: moment(note.date),
            repeatStartDate: null,
            repeatEndDate: null
        };

        let noteId = await this.insertNote(nextNote);
        nextNote.id = noteId;

        nextNote = await this.updateNoteLastAction(NoteAction.Add, nextNote);

        return nextNote;
    }
    // endregion

    // region delete, restore note
    async deleteNote(note) {
        let nextNote = {...note};
        if (nextNote.repeatType !== NoteRepeatType.NoRepeat && !nextNote.isShadow) {
            nextNote = await this.getNote(nextNote.forkFrom);
        }

        nextNote = await this.resetNoteManualOrderIndex(nextNote.id);

        nextNote = await this.updateNoteLastAction(NoteAction.Delete, nextNote);

        notificationService.clear(nextNote.id);

        return nextNote;
    }

    async getDeletedNotes() {
        let select = await executeSQL(
            `SELECT id, title, startTime, endTime, isNotificationEnabled, tag, repeatType, 
                contentItems, isFinished, forkFrom, manualOrderIndex, lastActionTime, date,
                (select GROUP_CONCAT(rep.value, ',') from NotesRepeatValues rep where rep.noteId = n.id OR rep.noteId = n.forkFrom) as repeatValues
            FROM Notes n
            WHERE lastAction = ? AND
            forkFrom IS NULL
            ORDER BY lastActionTime
            LIMIT 100;`
        , [NoteAction.Delete]);

        let notes = [];
        for(let i = 0; i < select.rows.length; i++) {
            notes.push(this.parseNoteWithTime(select.rows.item(i)));
        }

        return notes;
    }

    async restoreNote(note) {
        let nextNote = {...note};

        nextNote = await this.updateNoteLastAction(NoteAction.Edit, nextNote);

        notificationService.schedule(nextNote.id);

        return nextNote;
    }

    async removeDeletedNotes(untilDate) {
        await executeSQL(`
            DELETE FROM NotesRepeatValues
            WHERE noteId IN (
                SELECT noteId FROM NotesRepeatValues
                LEFT JOIN Notes ON NotesRepeatValues.noteId = Notes.id
                WHERE lastAction = ?${untilDate ? ' AND lastActionTime <= ?' : ''}
            );
        `, [NoteAction.Delete, ...(untilDate ? [untilDate] : [])]);

        return executeSQL(`
            DELETE FROM Notes 
            WHERE lastAction = ?${untilDate ? ' AND lastActionTime <= ?' : ''}
        `, [NoteAction.Delete, ...(untilDate ? [untilDate] : [])]);
    }
    // endregion

    // region on insert, update parse note
    parseNoteValues(note) {
        let nextNote = {...note};

        nextNote.parsedTitle = this.parseClickableItems(note.title);
        nextNote.contentItems = this.parseNoteContentItems(note.contentItems);

        return nextNote;
    }

    parseNoteContentItems(contentItems) {
        let nextContentItems = [];

        if (contentItems && contentItems.length) {
            for (let contentItem of contentItems) {
                let nextContentItem = {...contentItem};

                if (nextContentItem.type === NoteContentItemType.ListItem || nextContentItem.type === NoteContentItemType.Text) {
                    nextContentItem.parsedValue = this.parseClickableItems(nextContentItem.value);
                }

                nextContentItems.push(nextContentItem);
            }
        }

        return nextContentItems;
    }

    emailMath = /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/gi;
    phoneMatch = /\+?\d{10,13}/gi;
    urlMatch = /(https?:\/\/[^ ]*)/gi;

    parseClickableItems(value) {
        if (!value) {
            return;
        }

        return value
            .replace(this.emailMath, "<a href='mailto:$&'>$&</a>")
            .replace(this.phoneMatch, "<a href='tel:$&'>$&</a>")
            .replace(this.urlMatch, "<a href='$&'>$&</a");
    }
    // endregion

    repeatOptions = [
        { val: NoteRepeatType.NoRepeat, translateId: "repeat-type-no-repeat" },
        { val: NoteRepeatType.Day, translateId: "repeat-type-day" },
        { val: NoteRepeatType.Week, translateId: "repeat-type-week" },
        { val: NoteRepeatType.Any, translateId: "repeat-type-any" }
    ];

    weekRepeatOptions = [
        { val: 1, translateId: "monday" },
        { val: 2, translateId: "tuesday" },
        { val: 3, translateId: "wednesday" },
        { val: 4, translateId: "thursday" },
        { val: 5, translateId: "friday" },
        { val: 6, translateId: "saturday" },
        { val: 7, translateId: "sunday" }
    ];

    getRepeatTypeOptions() {
        return [...this.repeatOptions]
    }

    getWeekRepeatOptions() {
        return [...this.weekRepeatOptions]
    }
}

let noteService = new NotesService();

export default noteService;