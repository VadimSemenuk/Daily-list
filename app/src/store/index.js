import {createStore, applyMiddleware} from 'redux';
import thunkMiddleware from 'redux-thunk';

import reducers from '../reducers';

function initStore (initData) {   
    return createStore(
        reducers,
        initData,
        applyMiddleware(
            thunkMiddleware
        )
    );
}

export default initStore;