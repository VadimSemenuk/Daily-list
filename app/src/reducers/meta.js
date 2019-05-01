function loader (state = {}, action) {
    switch(action.type) {   
        case 'SET_BACKUP_MIGRATION_STATE':
            return action.state;
        default:        
            return state;
    }
}

export default loader;