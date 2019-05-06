let initState = [];

function trash (state = initState, action) {
    switch(action.type) {   
        case 'RECEIVE_DELETED_NOTES':
            return action.items;
        case 'RESTORE_NOTE':
            return state.filter((i) => i.key !== action.note.key);
        case 'CLEAN_TRASH':
            return initState;
        default:        
            return state;
    }
}

export default trash;