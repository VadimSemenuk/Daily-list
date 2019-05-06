function user (state = {}, action) {
    switch(action.type) {   
        case 'RECEIVE_USER':
            return action.user;
        case 'CLEAR_USER':
            return {};
        default:        
            return state;
    }
}

export default user;