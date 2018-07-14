function password (state = false, action) {
    switch(action.type) {   
        case 'SET_VALID':
            return true
        default:        
            return state;
    }
}

export default password;