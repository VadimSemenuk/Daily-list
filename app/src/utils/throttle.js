export function throttle(func, ms) {
    let isThrottled = false;
    let savedArgs;
    let savedThis;

    function wrapper() {
        if (isThrottled) {
            savedArgs = arguments;
            savedThis = this;
            return;
        }

        func.apply(this, arguments);

        isThrottled = true;

        setTimeout(function() {
            isThrottled = false;
            if (savedArgs) {
                wrapper.apply(savedThis, savedArgs);
                savedArgs = savedThis = null;
            }
        }, ms);
    }

    return wrapper;
}

export function throttleAction(action, wait, options) {
    const throttled = throttle(
        (dispatch, getState, actionArgs) => dispatch(action(...actionArgs)),
        wait,
        options
    );

    const thunk = (...actionArgs) => (dispatch, getState) => throttled(dispatch, getState, actionArgs);

    return thunk;
}