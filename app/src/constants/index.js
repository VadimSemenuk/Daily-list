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

    WeekValues: [
        { val: 1, translateId: "monday" },
        { val: 2, translateId: "tuesday" },
        { val: 3, translateId: "wednesday" },
        { val: 4, translateId: "thursday" },
        { val: 5, translateId: "friday" },
        { val: 6, translateId: "saturday" },
        { val: 7, translateId: "sunday" }
    ],

    toTranslateId(repeatType) {
        switch(repeatType) {
            case NoteRepeatType.NoRepeat:
                return "repeat-type-no-repeat";
            case NoteRepeatType.Day:
                return "repeat-type-day";
            case NoteRepeatType.Week:
                return "repeat-type-week";
            case NoteRepeatType.Month:
                return "repeat-type-month";
            case NoteRepeatType.Any:
                return "repeat-type-any";
        }
    },

    toArray() {
        return [
            NoteRepeatType.NoRepeat,
            NoteRepeatType.Day,
            NoteRepeatType.Week,
            NoteRepeatType.Any
        ]
    }
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

export const SortType = {
    TimeSort: 1,
    TimeAddSort: 2,
};

export const SortDirectionType = {
    DESC: 1,
    ASC: 2
};

export const NoteUpdateType = {
    NO_REPEAT: 1,
    REPEAT_TYPE_CHANGE: 2,
    REPEAT_CURRENT: 3,
    REPEAT_ALL: 4
};

export const ColorTags = [
    'transparent',
    '#00213C',
    '#c5282f',
    '#62A178',
    '#3498DB',
    '#BF0FB9',
    '#9A6B00',
    '#9CECC5',
    '#e2dd2d',
    '#e23494',
    '#7e17dc',
    '#333',
    "#bfbfbf"
];