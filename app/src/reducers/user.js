function user (state = {}, action) {
    switch(action.type) {   
        case 'RECIVE_USER':
            return action.user
        case 'CLEAR_USER':
            return {}
        default:        
            return state;
    }
}

export default user;