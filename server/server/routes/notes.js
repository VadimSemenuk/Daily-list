const router = require('express-promise-router')();
const passport = require("passport");
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

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

    // restore old backup
    router.post('/backup/old/transform-to-new', (req, res, next) => {
        const filePath = path.join(__dirname, `../../sqlite-databases/${req.body.fileId}`);

        axios.get(
            `https://www.googleapis.com/drive/v3/files/${req.body.fileId}?alt=media`,
            {
                headers: {
                    'Authorization': req.body.token
                },
                responseType: 'stream'
            }
        )
            .then((response) => {
                const writeStream = fs.createWriteStream(filePath);
                return new Promise((resolve, reject) => {
                    writeStream.on('error', () => {
                        reject();
                    });
                    writeStream.on('finish', () => {
                        resolve();
                    });
                    response.data.pipe(writeStream);
                });
            })
            .then(() => {
                const db = new sqlite3.Database(filePath, sqlite3.OPEN_READWRITE, (err) => {
                    if (err) {
                        throw err;
                    }
                
                    db.all(`
                        SELECT t.id, t.uuid, t.title, t.startTime, t.endTime, t.startTimeCheckSum, t.endTimeCheckSum, t.notificate, t.tag, 
                            t.isSynced, t.isLastActionSynced, t.repeatType, t.userId, t.added, t.dynamicFields, t.finished, t.forkFrom, 
                            tr.repeatValues
                        FROM (
                            SELECT t.id, GROUP_CONCAT(rep.value, ',') as repeatValues
                            FROM Tasks t
                            LEFT JOIN TasksRepeatValues rep ON t.id = rep.taskId
                            GROUP BY t.id
                        ) tr
                        LEFT JOIN Tasks t ON t.id = tr.id;
                    `, (err, res) => {
                        if (err) {
                            throw err;
                        }
                        console.log(res);
                    });
                });
            })
            .catch(err => {
                res.status(500);
                res.end();
            })
    })

    return router
}