function loader (state = false, action) {
    switch(action.type) {   
        case 'TRIGGER_LOADER': 
            return action.state !== undefined ? action.state : !state;
        default:        
            return state;
    }
}

export default loader;