const router = require('express-promise-router')();

module.exports = function (logRep) {  
    router.post('/load', (req, res, next) => {
        logRep.logLoad(req.body.deviceId);
        res.end(); 
    });

    return router
}