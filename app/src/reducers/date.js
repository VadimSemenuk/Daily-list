import moment from 'moment';

let init = moment().startOf('day');

function date (state = init, action) {
    switch(action.type) {
        case 'SET_DATES_AND_UPDATE_NOTES':
        case 'UPDATE_DATES_AND_NOTES':
        case 'SET_CURRENT_DATE':        
            return moment(action.payload.date);
        default: 
            return state;
    }
}

export default date;