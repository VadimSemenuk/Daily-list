const router = require('express-promise-router')();
const passport = require("passport");

module.exports = function () {
    router.post('/send-new', (req, res, next) => {
        let lang = req.body.lang;
        let newPassword = req.body.newPassword;
        // send email
        res.end();
    });

    return router
}