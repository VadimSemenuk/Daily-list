function password (state = true, action) {
    switch(action.type) {   
        case 'SET_PASSWORD_CHECK_STATE':
            return action.payload.value
        default:        
            return state;
    }
}

export default password;