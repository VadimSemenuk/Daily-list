let init = [];

function receiveNote(state, note) {
    delete note.prevNote;

    let assignFn = (list) => ({
        date: list.date, 
        items: [
            ...list.items, 
            {
                ...note,
                added: list.date
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
                if (list.date.valueOf() === note.added.valueOf()) {
                    return assignFn(list)
                }
                return list
            };
        }
    }

    return state.map(fn);
}

function notes (state = init, action) {
    switch(action.type) {
        case 'SET_DATES_AND_UPDATE_NOTES': {
            return action.payload.notes.slice();
        }
        case 'UPDATE_DATES_AND_NOTES': {
            return [...state.slice(0, action.payload.nextIndex), action.payload.notes, ...state.slice(action.payload.nextIndex + 1)]
        }
        case 'RECEIVE_NOTE': {
            return receiveNote(state, action.payload.note);
        }
        case 'UPDATE_NOTE': {
            let startState = null;

            if (action.payload.prevNote.repeatType === "no-repeat") {
                startState = state.map((list) => {
                    return {...list, items: list.items.filter((note) => note.key !== action.payload.note.key)}
                });
            } else {
                startState = state.map((list) => {
                    return {...list, items: list.items.filter((note) => (
                        (note.key !== action.payload.note.key) &&
                        (note.forkFrom !== action.payload.note.key)
                    ))}
                });
            }

            return receiveNote(startState, action.payload.note);
        }
        case 'UPDATE_NOTE_DYNAMIC_FIELDS': {
            let nextState = state.slice();

            let actions = action.payload.notes ? action.payload.notes : [action.payload];

            actions.forEach((action) => {
                if (action.realFromShadow) {
                    let noteToFilterDate = action.note.added.valueOf();

                    nextState = nextState.map((list) => {
                        if (list.date.valueOf() === noteToFilterDate) {
                            return {...list, items: list.items.filter((note) => note.key !== action.note.forkFrom)}
                        }
                        return list;
                    });
                } else {
                    nextState = nextState.map((list) => {
                        return {...list, items: list.items.filter((note) => note.key !== action.note.key)}
                    });
                }

                nextState = nextState.map((list) => {
                    if (list.date.valueOf() === action.note.added.valueOf()) {
                        return {
                            date: list.date,
                            items: [...list.items, action.note]
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
        case "RENDER_NOTES": {
            return state.map((list) => {
                return {
                    ...list,
                    items: list.items.slice()
                }
            })
        }
        case "UPDATE_NOTES": {
            return action.payload.notes.slice();
        }
        case "UPDATE_MANUAL_SORT_INDEX": {
            if (action.payload.notes[0].mode === 2) {
                return [
                    {
                        ...state[0],
                        items: action.payload.notes
                    }
                ]
            } else {
                return state.map((list) => {
                    if (list.date.valueOf() === action.payload.notes[0].added.valueOf()) {
                        return {
                            ...list,
                            items: action.payload.notes
                        };
                    }
                    return list;
                });
            }
        }
        default: 
            return state;
    }
}

export default notes;