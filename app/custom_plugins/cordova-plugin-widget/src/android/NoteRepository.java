package com.dailylist.vadimsemenyk.widget;

import android.database.Cursor;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.TimeZone;

public class NoteRepository {
    private static final NoteRepository ourInstance = new NoteRepository();

    public static NoteRepository getInstance() {
        return ourInstance;
    }

    private NoteRepository() {
    }

    class SortByAddedTime implements Comparator<Object> {
        SortDirection direction;

        private SortByAddedTime(SortDirection direction) {
            this.direction = direction;
        }

        public int compare(Object a, Object b) {
            if (direction == SortDirection.ASC) {
                return ((Note) a).id - ((Note) b).id;
            } else {
                return ((Note) b).id - ((Note) a).id;
            }
        }
    }

    class SortByNoteTime implements Comparator<Object> {
        SortDirection direction;

        private SortByNoteTime(SortDirection direction) {
            this.direction = direction;
        }

        public int compare(Object a, Object b) {
            Note noteA = (Note) a;
            Note noteB = (Note) b;
            int noteASortValue = 0;
            int noteBSortValue = 0;

            if (noteA.startDateTime != null) {
                Calendar msNoteAStartOfDay = Calendar.getInstance();
                msNoteAStartOfDay.setTimeInMillis(noteA.startDateTime.getTimeInMillis());
                startOfDay(msNoteAStartOfDay);
                noteASortValue = (int) (noteA.startDateTime.getTimeInMillis() - msNoteAStartOfDay.getTimeInMillis());
            }

            if (noteB.startDateTime != null) {
                Calendar msNoteBStartOfDay = Calendar.getInstance();
                msNoteBStartOfDay.setTimeInMillis(noteB.startDateTime.getTimeInMillis());
                startOfDay(msNoteBStartOfDay);
                noteBSortValue = (int) (noteB.startDateTime.getTimeInMillis() - msNoteBStartOfDay.getTimeInMillis());
            }

            if (direction == SortDirection.ASC) {
                return noteASortValue - noteBSortValue;
            } else {
                return noteBSortValue - noteASortValue;
            }
        }
    }

    class SortByFinished implements Comparator<Object> {

        private SortByFinished() {
        }

        public int compare(Object a, Object b) {
            return (((Note) a).isFinished ? 1 : 0) - (((Note) b).isFinished ? 1 : 0);
        }
    }

    public ArrayList<Note> _getNotes(NoteTypes type, Calendar date) {
        ArrayList<Note> notes = new ArrayList<>();

        for (int i = 0; i < 10; i++) {
            ArrayList<NoteContentItem> contentItems = new ArrayList<NoteContentItem>();

            contentItems.add(new NoteContentItemTextArea("Text item"));
            contentItems.add(new NoteContentItemListItem("List item 1", false));
            contentItems.add(new NoteContentItemListItem("List item 2", true));
            contentItems.add(new NoteContentItemListItem("List item 3", true));

            Note note = new Note();
            note.colorTag = "#c5282f";
            note.startDateTime = Calendar.getInstance();
            note.endDateTime = Calendar.getInstance();
            note.isFinished = false;
            note.title = "Title";
            note.contentItems = contentItems;

            notes.add(note);
        }

        return notes;
    }

    public ArrayList<Note> getNotes(NoteTypes type, Calendar date) {
        ArrayList<Note> notes = new ArrayList<>();

        Cursor cursor = null;

        if (type == NoteTypes.Diary) {
            String sql = "SELECT id, tag, startTime, endTime, isFinished, title, contentItems"
                    + " FROM Notes n"
                    + " LEFT JOIN NotesRepeatValues rep ON n.id = rep.noteId"
                    + " WHERE"
                    + " n.lastAction != ?"
                    + " AND ("
                    + "     n.date = ?"
                    + "     OR ("
                    + "         n.date IS NULL AND NOT EXISTS (SELECT forkFrom FROM Notes WHERE forkFrom = n.id AND date = ?)"
                    + "         AND ("
                    + "             n.repeatType = ?"
                    + "             OR (n.repeatType = ? AND rep.value = ?)"
                    + "             OR (n.repeatType = ? AND rep.value = ?)"
                    + "         )"
                    + "     )"
                    + " )"
                    + " AND n.mode = ?;";

            cursor = DBHelper.getInstance().getWritableDatabase().rawQuery(
                    sql,
                    new String[] {"DELETE", String.valueOf(date.getTimeInMillis()), String.valueOf(date.getTimeInMillis()), "day", "week", String.valueOf(date.get(Calendar.DAY_OF_WEEK)), "any", String.valueOf(date.getTimeInMillis()), Integer.toString(NoteTypes.Diary.getValue())}
            );
        } else {
            String sql = "SELECT id, tag, isFinished, title, contentItems"
                    + " FROM Notes"
                    + " WHERE"
                    + " lastAction != ?"
                    + " AND mode = ?;";

            cursor = DBHelper.getInstance().getWritableDatabase().rawQuery(
                    sql,
                    new String[] {Integer.toString(NoteTypes.Note.getValue()), "DELETE"}
            );
        }

        if(cursor.moveToFirst()){
            do {
                Note note = new Note();

                note.id = cursor.getInt(cursor.getColumnIndex("id"));

                note.colorTag = cursor.getString(cursor.getColumnIndex("tag"));

                if (!cursor.isNull(cursor.getColumnIndex("startTime"))) {
                    long _startDateTime = cursor.getLong(cursor.getColumnIndex("startTime"));
                    Calendar startDateTime = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
                    startDateTime.setTimeInMillis(_startDateTime);
                    note.startDateTime = convertFromUTCToLocal(startDateTime);
                }

                if (!cursor.isNull(cursor.getColumnIndex("endTime"))) {
                    long _endDateTime = cursor.getLong(cursor.getColumnIndex("endTime"));
                    Calendar endDateTime = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
                    endDateTime.setTimeInMillis(_endDateTime);
                    note.endDateTime = convertFromUTCToLocal(endDateTime);
                }

                note.isFinished = cursor.getInt(cursor.getColumnIndex("isFinished")) == 1;

                note.title = cursor.getString(cursor.getColumnIndex("title"));

                String contentItemsJson = cursor.getString(cursor.getColumnIndex("contentItems"));
                ArrayList<NoteContentItem> contentItems = new ArrayList<NoteContentItem>();
                Gson gson = new Gson();
                JsonParser parser = new JsonParser();
                if (contentItemsJson.length() > 0) {
                    JsonArray array = parser.parse(contentItemsJson).getAsJsonArray();
                    for (int i = 0; i < array.size(); i++) {
                        NoteContentItem contentField = null;

                        JsonObject obj = array.get(i).getAsJsonObject();
                        String contentItemType = obj.get("type").getAsString();
                        if (contentItemType.equals("listItem")) {
                            contentField = gson.fromJson(array.get(i), NoteContentItemListItem.class);
                        } else if (contentItemType.equals("text")) {
                            contentField = gson.fromJson(array.get(i), NoteContentItemTextArea.class);

                        }
                        contentItems.add(contentField);
                    }
                }
                note.contentItems = contentItems;

                notes.add(note);
            }
            while (cursor.moveToNext());
        }
        cursor.close();

        String getSettingsSQL = "SELECT sortType, sortDirection FROM Settings";

        Cursor getSettingsCursor = DBHelper.getInstance().getWritableDatabase().rawQuery(getSettingsSQL, null);

        SortType sortType = SortType.ADDED_TIME;
        SortDirection sortDirection = SortDirection.ASC;

        if(getSettingsCursor.moveToFirst()){
            do {
                sortType = SortType.valueOf(getSettingsCursor.getInt(getSettingsCursor.getColumnIndex("sortType")));
                sortDirection = SortDirection.valueOf(getSettingsCursor.getInt(getSettingsCursor.getColumnIndex("sortDirection")));
            }
            while (getSettingsCursor.moveToNext());
        }
        getSettingsCursor.close();

        if (sortType == SortType.NOTE_TIME) {
            Collections.sort(notes, new SortByNoteTime(sortDirection));
        } else {
            Collections.sort(notes, new SortByAddedTime(sortDirection));
        }

        Collections.sort(notes, new SortByFinished());

        return notes;
    }

    Calendar convertFromUTCToLocal(Calendar utcDateTime) {
        int utcYear = utcDateTime.get(Calendar.YEAR);
        int utcMonth = utcDateTime.get(Calendar.MONTH);
        int utcDate = utcDateTime.get(Calendar.DATE);
        int utcHour = utcDateTime.get(Calendar.HOUR_OF_DAY);
        int utcMinute = utcDateTime.get(Calendar.MINUTE);

        Calendar dateTimeLocal = Calendar.getInstance();
        dateTimeLocal.set(utcYear, utcMonth, utcDate, utcHour, utcMinute, 0);

        return dateTimeLocal;
    }

    void startOfDay(Calendar dateTime) {
        dateTime.set(Calendar.HOUR, 0);
        dateTime.set(Calendar.MINUTE, 0);
        dateTime.set(Calendar.SECOND, 0);
        dateTime.set(Calendar.MILLISECOND, 0);
    }
}