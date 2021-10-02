import {NoteRepeatType} from "../constants";

let init = [];

function getReceiveNoteFn(note) {
    let assignFn = (list) => ({
        date: list.date, 
        items: [
            ...list.items, 
            {
                ...note,
                date: list.date
            }
        ] 
    });
    let fn;

    switch(note.repeatType) {
        case NoteRepeatType.Day: {
            fn = assignFn;
            break;
        }
        case NoteRepeatType.Any: {
            fn = (list) => {
                if (note.repeatValues.includes(list.date.valueOf())) {
                    return assignFn(list)
                }
                return list
            };
            break;
        }
        case NoteRepeatType.Week: {
            fn = (list) => {
                if (note.repeatValues.includes(list.date.isoWeekday())) {
                    return assignFn(list)
                }
                return list
            };
            break;
        }
        default: {
            fn = (list) => {
                if (!list.date || (list.date.isSame(note.date))) {
                    return assignFn(list)
                }
                return list
            };
        }
    }

    return fn;
}

function fromShadowToReal(state, note) {
    return state.map((list) => {
        if (list.date.isSame(note.repeatItemDate)) {
            return {...list, items: list.items.filter((item) => item.id !== note.forkFrom)}
        }
        return list;
    });
}

function notes (state = init, action) {
    switch(action.type) {
        case 'RECEIVE_NOTE': {
            return state.map(getReceiveNoteFn(action.payload.note));
        }
        case 'UPDATE_NOTE': {
            return state
                .map((list) => {
                    return {
                        ...list,
                        items: list.items.filter((note) => (
                            (note.id !== action.payload.note.id) &&
                            (note.forkFrom !== action.payload.note.id)
                        ))
                    }
                })
                .map(getReceiveNoteFn(action.payload.note));
        }
        case 'UPDATE_NOTE_DYNAMIC': {
            let nextState = state.slice();

            if (action.payload.fromShadowToReal) {
                action.payload.notes.forEach((note) => {
                    if (note.repeatItemDate !== null) {
                        nextState = fromShadowToReal(nextState, note);
                    }
                });
            }

            action.payload.notes.forEach((note) => {
                nextState = nextState
                    .map((list) => ({...list, items: list.items.filter((item) => item.id !== note.id)}))
                    .map((list) => {
                        if (!list.date || (list.date.isSame(note.date))) {
                            return {
                                date: list.date,
                                items: [...list.items, note]
                            }
                        }
                        return list;
                    });
            });

            return nextState;
        }
        case 'DELETE_NOTE': {
            return state.map((list) => {
                let nextList = list.items.filter((note) => (
                    (note.id !== action.payload.note.id) &&
                    (note.forkFrom !== action.payload.note.id)
                ));
                return {
                    date: list.date, 
                    items: nextList
                }
            });
        }
        case 'SET_DATES_AND_UPDATE_NOTES':
        case "UPDATE_NOTES_LIST": {
            return action.payload.notes.slice();
        }
        case 'UPDATE_DATES_AND_NOTES': {
            return [...state.slice(0, action.payload.nextIndex), action.payload.notes, ...state.slice(action.payload.nextIndex + 1)]
        }
        case "RENDER_NOTES": {
            return state.map((list) => {
                return {
                    ...list,
                    items: list.items.slice()
                }
            })
        }
        case "SET_NOTES_LIST_ITEMS": {
            return state.map((list) => {
                if (!list.date || (list.date.isSame(action.payload.date))) {
                    return {
                        ...list,
                        items: action.payload.notes
                    };
                }
                return list;
            });
        }
        default: 
            return state;
    }
}

export default notes;