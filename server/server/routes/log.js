const router = require('express-promise-router')();

module.exports = function (logRep) {  
    router.post('/load', (req, res, next) => {
        logRep.logLoad(req.body.deviceId);
        res.end(); 
    });

    router.post('/error', (req, res, next) => {
        logRep.logError(req.body);
        res.end(); 
    });

    return router
};