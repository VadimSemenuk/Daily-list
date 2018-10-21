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



    // synchronization 

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



    // backup

    router.post('/backup', passport.authenticate('jwt', {session: false}), async (req, res, next) => {
        notesRep.backup(req.body.note, req.body.userId)
            .then((insert) => {
                res.end();  
            })
    });

    return router
}