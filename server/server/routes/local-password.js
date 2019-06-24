const router = require('express-promise-router')();
const passport = require("passport");

module.exports = function () {
    router.post('/send-new', passport.authenticate('jwt', {session: false}), (req, res, next) => {
        let lang = req.body.lang;
        let newPassword = req.body.newPassword;
        // send email
        res.end();
    });

    return router
}