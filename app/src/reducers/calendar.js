let init = {
    count: {}
}

function date (state = init, action) {
    switch(action.type) {
        case "GET_NOTES_COUNT": 
        case "UPDATE_NOTES_COUNT":    
            return action.nextCount;
        default: 
            return state;
    }
}

export default date;