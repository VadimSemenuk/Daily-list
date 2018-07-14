function synchronization (state = false, action) {
    switch(action.type) {   
        case 'TRIGGER_SYNCHRONIZATION_LOADER':
            return action.state
        default:        
            return state;
    }
}

export default synchronization;