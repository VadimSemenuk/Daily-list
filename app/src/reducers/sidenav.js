let defaultState = {
    items: [],
    isOpen: false
};

function sidenav (state = defaultState, action) {
    switch(action.type) {
        case 'SET_SIDENAV_ITEMS': {
            return {...state, items: action.payload.items};
        }
        case 'TRIGGER_SIDENAV': {
            return {...state, isOpen: !state.isOpen};
        }
        default:
            return state;
    }
}

export default sidenav;