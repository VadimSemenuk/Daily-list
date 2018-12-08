function error (state = false, action) {
    switch(action.type) {
        case 'TRIGGER_ERROR_MODAL':     
            return state ? false : {message: action.message}
        default: 
            return state;
    }
}

export default error;