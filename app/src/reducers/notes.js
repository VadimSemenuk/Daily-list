let init = [];

function notes (state = init, action) {
    switch(action.type) {   
        case 'ADD_NOTE': {
            let nextState = state.slice();
            let nextStateDateList = [...nextState[1], action.note];
            nextState[1] = nextStateDateList;
            return nextState;
        }
        case 'SET_DATE':
        case 'RECIVE_NOTES': {
            return action.notes;
        }
        case 'SET_LIST_DATE': {
            let nextState = state.slice();
            nextState[action.dateIndex] = action.notes;
            return nextState;
        }
        case 'RECIVE_NOTE': {
            let nextState = state.slice();
            let nextStateDateList = [...nextState[action.dateIndex], action.note];
            nextState[action.dateIndex] = nextStateDateList;
            return nextState;
        }
        case 'UPDATE_NOTE_DYNAMIC_FIELDS': {
            let nextState = state.slice();
            let nextStateDateList = nextState[action.dateIndex].slice();            
            let nextStateDateListItem = Object.assign({}, nextStateDateList[action.noteIndex], {dynamicFields: action.dynamicFields});
            nextStateDateList[action.noteIndex] = nextStateDateListItem;
            nextState[action.dateIndex] = nextStateDateList;            
            return nextState;
        }
        case 'SET_NOTE_CHECKED_STATE': {
            let nextState = state.slice();
            let nextStateDateList = nextState[action.dateIndex].slice();            
            let nextStateDateListItem = Object.assign({}, nextStateDateList[action.noteIndex], {finished: action.state});
            nextStateDateList[action.noteIndex] = nextStateDateListItem;
            nextState[action.dateIndex] = nextStateDateList;        
            return nextState;
        }
        case 'DELETE_NOTE': {
            let nextState = state.slice();
            let nextStateDateList = [...nextState[action.dateIndex].slice(0, action.noteIndex), ...nextState[action.dateIndex].slice(action.noteIndex + 1)];            
            nextState[action.dateIndex] = nextStateDateList;
            return nextState;
        }
        case 'UPDATE_NOTE': {
            let nextState = state.slice();
            let nextStateDateList = nextState[action.dateIndex].slice();
            nextStateDateList[action.noteIndex] = action.note; 
            nextState[action.dateIndex] = nextStateDateList;
            return nextState;
        }
        default: 
            return state;
    }
}

export default notes;