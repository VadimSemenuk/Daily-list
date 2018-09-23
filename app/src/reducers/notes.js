let init = [];

function reciveNote(state, note) {
    let assignFn = (list) => Object.assign({}, list, { items: [...list.items, note] });
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
            }
            break;
        }
        default: {
            fn = (list) => {
                if (list.date.valueOf() === note.added.valueOf()) {
                    return assignFn(list)
                }
                return list
            }
        }
    }

    return state.map(fn);
}

function notes (state = init, action) {
    switch(action.type) {
        case 'SET_DATES_AND_UPDATE_NOTES':
        case 'RECIVE_NOTES': {
            return action.notes.slice();
        }
        case 'UPDATE_DATES_AND_NOTES':
        case 'UPDATE_WEEK_DATES_AND_NOTES': {
            return [...state.slice(0, action.nextIndex), action.notes, ...state.slice(action.nextIndex + 1)]
        }
        case 'RECIVE_NOTE': {
            return reciveNote(state, action.note);
        }
        case 'UPDATE_NOTE_DYNAMIC_FIELDS': {
            let assignFn = (list) => {
                let nextList = list.items.map((note) => {
                    if (note.key === action.note.key) {
                        return Object.assign({}, note, {dynamicFields: action.dynamicFields})
                    }
                    return note
                })
                return Object.assign({}, list, { items: nextList })
            }
            let fn = (action.note.repeatType === "no-repeat" || action.note.repeatType === "week") ?
                (list) => {
                    if (list.date.valueOf() === action.note.added.valueOf()) {
                        return assignFn(list);
                    }
                    return list
                } :
                assignFn

            return state.map(fn);
        }
        case 'SET_NOTE_CHECKED_STATE': {
            let assignFn = (list) => {
                let nextList = list.items.map((note) => {
                    if (note.key === action.note.key) {
                        return Object.assign({}, note,  {finished: action.state})
                    }
                    return note
                })
                return Object.assign({}, list, { items: nextList })
            }
            let fn = (action.note.repeatType === "no-repeat" || action.note.repeatType === "week") ?
                (list) => {
                    if (list.date.valueOf() === action.note.added.valueOf()) {
                        return assignFn(list);
                    }
                    return list
                } :
                assignFn

            return state.map(fn);
        }
        case 'UPDATE_NOTE': {
            let startState = state.map((list) => {
                return {...list, items: list.items.filter((note) => note.key !== action.note.key)}
            });

            return reciveNote(startState, action.note);
        }
        case 'DELETE_NOTE': {
            let assignFn = (list) => {
                let nextList = list.items.filter((note) => note.key !== action.note.key)
                return Object.assign({}, list, { items: nextList })
            }
            let fn = (action.note.repeatType === "no-repeat" || action.note.repeatType === "week") ?
                (list) => {
                    if (list.date.valueOf() === action.note.added.valueOf()) {
                        return assignFn(list);
                    }
                    return list
                } :
                assignFn

            return state.map(fn);
        }
        case "RENDER_NOTES": {
            return state.map((list) => {
                return {
                    ...list,
                    items: list.items.slice()
                }
            })
        }
        default: 
            return state;
    }
}

export default notes;