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
        case "day": {
            fn = assignFn;
            break;
        }
        case "any": {
            fn = (list) => {
                if (note.repeatDates.includes(list.date.valueOf())) {
                    return assignFn(list)
                }
                return list
            };
            break;
        }
        case "week": {
            fn = (list) => {
                if (note.repeatDates.includes(list.date.isoWeekday())) {
                    return assignFn(list)
                }
                return list
            };
            break;
        }
        default: {
            fn = (list) => {
                if (list.date.valueOf() === note.date.valueOf()) {
                    return assignFn(list)
                }
                return list
            };
        }
    }

    return fn;
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
                            (note.key !== action.payload.note.key) &&
                            (note.forkFrom !== action.payload.note.key)
                        ))
                    }
                })
                .map(getReceiveNoteFn(action.payload.note));
        }
        case 'UPDATE_NOTE_DYNAMIC': {
            let nextState = state.slice();

            action.payload.notes.forEach((note) => {
                if (note.forkFrom !== -1) {
                    nextState = nextState.map((list) => {
                        if (list.date.valueOf() === note.date.valueOf()) {
                            return {...list, items: list.items.filter((item) => item.key !== note.forkFrom)}
                        }
                        return list;
                    });
                }
                nextState = nextState
                    .map((list) => ({...list, items: list.items.filter((item) => item.key !== note.key)}))
                    .map((list) => {
                        if (list.date.valueOf() === note.date.valueOf()) {
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
                    (note.key !== action.payload.note.key) &&
                    (note.forkFrom !== action.payload.note.key)
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