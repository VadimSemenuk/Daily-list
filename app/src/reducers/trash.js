function trash (state = [], action) {
    switch(action.type) {   
        case 'RECIVE_TRASH_NOTES':
            return action.items;
        case 'RESTORE_NOTE':
            return state.filter((i) => i.key !== action.note.key);
        default:        
            return state;
    }
}

export default trash;