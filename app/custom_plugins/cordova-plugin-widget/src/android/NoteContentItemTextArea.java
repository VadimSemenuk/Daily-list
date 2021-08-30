package com.dailylist.vadimsemenyk.widget;

import java.io.Serializable;

public class NoteContentItemTextArea extends NoteContentItem implements Serializable {
    public String value;

    public NoteContentItemTextArea(String text) {
        this.value = text;
    }
}