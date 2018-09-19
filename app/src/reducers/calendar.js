let count = {
    count: {},
    repeatable: {
        day: 0,
        week: {},
        any: {}
    }
}

let init = {
    week: count,
    month: count
}

function date (state = init, action) {
    switch(action.type) {
        case "GET_COUNT": 
            return {...state, ...action.nextCount};
        default: 
            return state;
    }
}

export default date;