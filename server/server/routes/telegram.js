const router = require('express-promise-router')();

module.exports = function () {  
    router.post('/message', (req, res, next) => {
        let body = req.body;
        console.log(body);
        res.end(); 
    });

    return router
}