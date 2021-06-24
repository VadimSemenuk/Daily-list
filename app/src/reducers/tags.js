let init = [];

function tags (state = init, action) {
    switch(action.type) {
        case 'TAG_ADD': {
            return [...state, action.payload.tag]
        }
        case 'TAG_DELETE': {
            return state.filter((tag) => tag.id !== action.payload.id);
        }
        case 'TAG_UPDATE': {
            let tagIndex = state.findIndex((tag) => tag.id === action.payload.tag.id);
            return [...state.slice(0, tagIndex), action.payload.tag, ...state.slice(tagIndex + 1)];
        }
        default:
            return state;
    }
}

export default tags;