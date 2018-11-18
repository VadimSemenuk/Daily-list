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

    router.post("/apply-local-changes",  async (req, res, next) => {
        await notesRep.applyLocalChanges(req.body.notSynkedLocalNotes, req.body.deviceId, req.user);
        res.end();
    })



    // backup

    router.post('/backup', (req, res, next) => {
        notesRep.backup(req.body.note, 1)
            .then((insert) => {
                let inserted = insert ? Boolean(insert.rowCount) : false;
                res.send(inserted); 
            })
            .catch((err) => {
                console.warn(err);
                res.status(500);
                res.end();
            })
    });

    router.post('/backup/batch', (req, res, next) => {
        notesRep.backupBatch(req.body.notes, 1)
            .then((insert) => {
                let inserted = insert ? Boolean(insert.rowCount) : false;
                res.send(inserted); 
            })
            .catch((err) => {
                console.warn(err);
                res.status(500);
                res.end();
            })
    });

    router.put('/backup', (req, res, next) => {
        notesRep.updateBackup(req.body.note)
            .then((update) => {
                let updated = update ? Boolean(update.rowCount) : false;
                res.send(updated);  
            })
            .catch((err) => {
                console.warn(err);
                res.status(500);
                res.end();
            })
    });

    router.get('/backup', (req, res, next) => {
        notesRep.getUserBackups(1)
            .then((notes) => {
                res.json(notes);  
            })
            .catch((err) => {
                console.warn(err);
                res.status(500);
                res.end();
            })
    });

    router.get('/backup/user-last-backup-time', passport.authenticate('jwt', {session: false}), (req, res, next) => {
        notesRep.getUserLastBackupTime(req.user)
            .then((time) => {
                res.send(time); 
            })
            .catch((err) => {
                console.warn(err);
                res.status(500);
                res.end();
            })
    });

    return router
}