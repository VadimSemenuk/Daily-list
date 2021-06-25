let init = {};

function settings (state = init, action) {
    switch(action.type) {   
        case 'SET_SETTING':
            return {...state, ...action.payload.nextSettings}
        default:        
            return state;
    }
}

export default settings;