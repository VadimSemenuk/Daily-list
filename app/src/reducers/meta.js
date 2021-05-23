function meta (state = null, action) {
    switch(action.type) {
        case "SET_META":
            return {...state, ...action.payload.nextState};
        default:
            return state;
    }
}

export default meta;