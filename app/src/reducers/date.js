import moment from 'moment';

let init = moment().startOf('day');

function date (state = init, action) {
    switch(action.type) {
        case 'SET_DATE':
        case 'SET_LIST_DATE':        
            return moment(action.date);
        default: 
            return state;
    }
}

export default date;