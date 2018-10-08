const router = require('express-promise-router')();
const passport = require("passport");

module.exports = function (notesRep) {  
    router.post('/', passport.authenticate('jwt', {session: false}), async (req, res, next) => {
        await notesRep.addNote(req.body.note, req.body.deviceId, req.user);
        res.end(); 
    });

    router.delete('/', passport.authenticate('jwt', {session: false}), async (req, res, next) => {
        await notesRep.deleteNote(req.body.note, req.body.deviceId);
        res.end();
    });

    router.put('/', passport.authenticate('jwt', {session: false}), async (req, res, next) => {
        await notesRep.updateNote(req.body.note, req.body.deviceId);
        res.end();
    });

    router.post('/dynamic-fields', passport.authenticate('jwt', {session: false}), async (req, res, next) => {
        await notesRep.updateDynamicFields(req.body.note, req.body.deviceId);
        res.end();
    });

    router.post('/finish-state', passport.authenticate('jwt', {session: false}), async (req, res, next) => {
        await notesRep.updateFinishState(req.body.note, req.body.deviceId);
        res.end();
    });

    router.post('/backup', passport.authenticate('jwt', {session: false}), async (req, res, next) => {
        await notesRep.backup(req.body.note); 
        res.end();       
    });

    return router
}