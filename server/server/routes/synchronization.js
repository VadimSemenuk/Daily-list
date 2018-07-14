const router = require('express-promise-router')();
const passport = require("passport");

module.exports = function (notesRep) {  
    router.get('/new', passport.authenticate('jwt', {session: false}), async (req, res, next) => {
        let newNotes = await notesRep.getNewNotes(req.query.deviceId, req.user);
        res.send(newNotes);
    });

    router.post('/confirm-local-addition', passport.authenticate('jwt', {session: false}), async (req, res, next) => {
        await notesRep.setMultiplieTaskDevces(req.body.settedNoteUUIDs, req.body.deviceId, req.user);
        res.end();
    });

    router.post("/apply-local-changes", passport.authenticate("jwt", {session: false}), async (req, res, next) => {
        await notesRep.applyLocalChanges(req.body.notSynkedLocalNotes, req.body.deviceId, req.user);
        res.end();
    })

    return router
}