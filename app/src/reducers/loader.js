function loader (state = false, action) {
    switch(action.type) {   
        case 'TRIGGER_LOADER': 
            return action.payload.hasOwnProperty('state') ? action.payload.state : !state;
        default:        
            return state;
    }
}

export default loader;