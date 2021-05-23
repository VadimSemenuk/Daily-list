export const NoteMode = {
    WithDateTime: 1,
    WithoutDateTime: 2
};

export const NotesScreenMode = {
    WithDateTime: 1,
    WithoutDateTime: 2
};

export const NoteAction = {
    Add: 'ADD',
    Edit: 'EDIT',
    Delete: 'DELETE'
};

export const NoteRepeatType = {
    NoRepeat: 'no-repeat',
    Day: 'day',
    Week: 'week',
    Month: 'month',
    Any: 'any',
};

export const NoteContentItemType = {
    Text: 'text',
    ListItem: 'listItem',
    Image: 'snapshot'
};

export const CalendarNotesCounterMode = {
    NotShow: 0,
    OnlyNotFinished: 1,
    All: 2,

    toList: () => {
        return [CalendarNotesCounterMode.NotShow, CalendarNotesCounterMode.OnlyNotFinished, CalendarNotesCounterMode.All]
            .map((value) => ({
                textId: CalendarNotesCounterMode.toTextId(value),
                value
            }));
    },

    toTextId: (value) => {
        switch(value) {
            case CalendarNotesCounterMode.NotShow:
                return "notes-count-not-show";
            case CalendarNotesCounterMode.OnlyNotFinished:
                return "notes-count-only-finished";
            case CalendarNotesCounterMode.All:
                return "notes-count-all";
            default:
                return null;
        }
    }
};
