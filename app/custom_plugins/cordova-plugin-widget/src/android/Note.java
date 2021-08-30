package com.dailylist.vadimsemenyk.widget;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Calendar;

public class Note implements Serializable {
    public int id;

    public String colorTag;
    public Calendar startDateTime;
    public Calendar endDateTime;
    public Boolean isFinished;
    public String title;
    public ArrayList<NoteContentItem> contentItems;

    public Note() {}
}