function loader (state = false, action) {
    switch(action.type) {   
        case 'TRIGGER_LOADER': 
            return action.hasOwnProperty('state') ? action.state : !state;
        default:        
            return state;
    }
}

export default loader;