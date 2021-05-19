let init = [];

function notes (state = init, action) {
    switch(action.type) {
        case 'RECEIVE_SEARCH_NOTES': {
            return action.payload.notes.slice();
        }
        case 'RESET_SEARCH_NOTES': {
            return init;
        }
        default:
            return state;
    }
}

export default notes;