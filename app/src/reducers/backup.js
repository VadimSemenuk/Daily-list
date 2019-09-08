let init = {
    local: [],
};

function backup (state = init, action) {
    switch(action.type) {
        case "SET_LOCAL_BACKUP_FILES":
            return {...state, local: [...action.payload.files]};
        default:
            return state;
    }
}

export default backup;