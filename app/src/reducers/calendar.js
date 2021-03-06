let init = {
    week: { count: {} },
    month: { count: {} }
};

function date (state = init, action) {
    switch(action.type) {
        case "GET_COUNT": 
            return {...state, ...action.payload.nextCount};
        default: 
            return state;
    }
}

export default date;