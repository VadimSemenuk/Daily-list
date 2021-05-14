let initState = [];

function trash (state = initState, action) {
    switch(action.type) {   
        case 'RECEIVE_DELETED_NOTES':
            return action.payload.items;
        case 'RESTORE_NOTE':
            return state.filter((i) => i.id !== action.payload.note.id);
        case 'CLEAN_TRASH':
            return initState;
        default:        
            return state;
    }
}

export default trash;