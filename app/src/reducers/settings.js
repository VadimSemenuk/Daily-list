let init = {
    theme: {
        id: 0,
        statusBar: null,
        header: null,
        body: null,
        realId: 0
    },
    defaultNotification: true,
    fastAdd: false,
    sort: {
        type: 0,
        direction: 0,
        finSort: 0,
    },
    passwordHash: null,
    fontSize: 14
};

function settings (state = init, action) {
    switch(action.type) {   
        case 'SET_SETTING':
            return Object.assign({}, state, { [action.payload.settingName]: action.payload.value})
        default:        
            return state;
    }
}

export default settings;