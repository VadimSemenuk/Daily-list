let init = [];

function receiveSingleNote(state, note) {
    let assignFn = (list) => ({
        date: list.date, 
        items: [...list.items, note] 
    });
    let fn = (list) => {
        if (list.date.valueOf() === note.added.valueOf()) {
            return assignFn(list)
        }
        return list
    };

    return state.map(fn);    
}

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
        case 'SET_DATES_AND_UPDATE_NOTES':
        case 'RECEIVE_NOTES': {
            return action.notes.slice();
        }
        case 'UPDATE_DATES_AND_NOTES': {
            return [...state.slice(0, action.nextIndex), action.notes, ...state.slice(action.nextIndex + 1)]
        }
        case 'RECEIVE_NOTE': {
            return receiveNote(state, action.note);
        }
        case 'UPDATE_NOTE': {
            let startState = null;

            if (action.prevNote) {
                if (action.prevNote.repeatType === "no-repeat") {
                    startState = state.map((list) => {
                        return {...list, items: list.items.filter((note) => note.key !== action.note.key)}
                    });
                } else {
                    startState = state.map((list) => {
                        return {...list, items: list.items.filter((note) => (
                            (note.key !== action.note.key) &&
                            (note.forkFrom !== action.note.key)
                        ))}
                    });
                }

                return receiveNote(startState, action.note);
            } else {
                let actions = action.notes ? action.notes : [action];

                let nextState = state.slice();

                actions.forEach((action) => {
                    if (action.inserted) {
                        let noteToFilterDate = action.note.added.valueOf();

                        startState = nextState.map((list) => {
                            if (list.date.valueOf() === noteToFilterDate) {
                                return {...list, items: list.items.filter((note) => note.key !== action.note.forkFrom)}
                            }
                            return list
                        });
                    } else {
                        startState = nextState.map((list) => {
                            return {...list, items: list.items.filter((note) => note.key !== action.note.key)}
                        });
                    }

                    nextState = receiveSingleNote(startState, action.note);
                })

                return nextState;
            }
        }
        case 'DELETE_NOTE': {
            return state.map((list) => {
                let nextList = list.items.filter((note) => (
                    (note.key !== action.note.key) &&
                    (note.forkFrom !== action.note.key)
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
            return action.notes.slice();
        }
        case "UPDATE_MANUAL_SORT_INDEX": {
            if (action.notes[0].mode === 2) {
                return [
                    {
                        ...state[0],
                        items: action.notes
                    }
                ]
            } else {
                return state.map((list) => {
                    if (list.date.valueOf() === action.notes[0].added.valueOf()) {
                        return {
                            ...list,
                            items: action.notes
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