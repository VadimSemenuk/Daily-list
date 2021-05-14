let init = [];

function notes (state = init, action) {
    switch(action.type) {
        case 'RECEIVE_SEARCH_NOTES': {
            return action.payload.notes.slice();
        }
        case 'RESET_SEARCH_NOTES': {
            return init;
        }
        case 'UPDATE_NOTE': {
            let actions = action.payload.notes ? action.payload.notes : [action.payload];

            let nextState = state.slice();
            actions.forEach((action) => {
                nextState = nextState.map((list) => {
                    let nextItems = list.items.filter((note) => note.id !== action.note.id);
                    if (!list.date || (list.date.valueOf() === action.note.date.valueOf())) {
                        nextItems.push(action.note);
                    }

                    return {
                        ...list,
                        items: nextItems
                    }
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
                    ...list,
                    items: nextList
                }
            });
        }
        default:
            return state;
    }
}

export default notes;