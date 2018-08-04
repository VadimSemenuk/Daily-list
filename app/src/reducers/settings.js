let init = {
    theme: {
        id: 0,
        statusBar: null,
        header: null,
        body: null
    },
    defaultNotification: true,
    fastAdd: false,
    sort: 0,
    password: null,
    fontSize: 14,
    finishedSort: 1,
    autoBackup: 0
};

function settings (state = init, action) {
    switch(action.type) {   
        case 'SET_SETTING':
            return Object.assign({}, state, { [action.settingName]: action.value})
        default:        
            return state;
    }
}

export default settings;