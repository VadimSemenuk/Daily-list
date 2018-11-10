function loader (state = {}, action) {
    switch(action.type) {   
        case 'SET_NEXTVERSIONMIGRATION_STATE': 
            return action.state;
        default:        
            return state;
    }
}

export default loader;