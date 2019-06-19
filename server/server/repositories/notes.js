let format = require('pg-format');

module.exports = class {
    constructor(db) {
        this.db = db;
    }

    async addNote(note, deviceId, userId) {
        const client = await this.db.client();
        try {
            await client.query("BEGIN;"); 
            let o = await client.query(
                `INSERT INTO Tasks
                (uuid, title, starttime, endtime, notificate, tag, dynamicfields, added, userId, lastAction, lastActionTime)
                VALUES($uuid, $title, $startTime, $endTime, $notificate, $tag, $dynamicFields, $added, $userId, 'ADD', $lastActionTime);`,
                {
                    ...note,
                    userId
                }
            );
            await this.setTaskDevice(client, note.uuid, deviceId, userId);
            await client.query('COMMIT;');
        } catch(err) {
            console.log(err);
        } finally {
            client.release();
        }
    }

    async updateNote(note, deviceId) {        
        const client = await this.db.client();
        try {
            await client.query("BEGIN;"); 
            await client.query(
                `UPDATE Tasks
                SET 
                    title = $title, 
                    starttime = $startTime, 
                    endtime = $endTime, 
                    notificate = $notificate, 
                    tag = $tag, 
                    dynamicfields = $dynamicFields, 
                    added = $added, 
                    finished = $finished, 
                    lastAction = 'EDIT', 
                    lastActionTime = $lastActionTime
                WHERE uuid = $uuid;`,
                {
                    ...note
                }
            )
            await this.resetTaskDevices(client, note.uuid, deviceId);
            await client.query('COMMIT;');
        } catch(err) {
            console.log(err);
        } finally {
            client.release();
        }
    }

    async deleteNote(note, deviceId) {
        const client = await this.db.client();
        try {
            await client.query("BEGIN;"); 
            await this.db.query(
                `UPDATE Tasks
                SET lastAction = 'DELETE', lastActionTime = $lastActionTime
                WHERE uuid = $uuid`,
                note
            );   
            await this.resetTaskDevices(client, note.uuid, deviceId);            
            await client.query('COMMIT;');
        } catch(err) {
            console.log(err);
        } finally {
            client.release();
        }
    }

    async updateDynamicFields(note, deviceId) {
        const client = await this.db.client();
        try {
            await client.query("BEGIN;");             
            await this.db.query(
                `UPDATE Tasks 
                SET dynamicFields = $dynamicFields, lastAction = 'EDIT', lastActionTime = $lastActionTime
                WHERE uuid = $uuid;`,
                note
            );   
            await this.resetTaskDevices(client, note.uuid, deviceId);                        
            await client.query('COMMIT;');
        } catch(err) {
            console.log(err);
        } finally {
            client.release();
        }
    }

    async updateFinishState(note, deviceId) {
        const client = await this.db.client();
        try {
            await client.query("BEGIN;");     
            await this.db.query(
                `UPDATE Tasks 
                SET finished = $state, lastAction = 'EDIT', lastActionTime = $lastActionTime
                WHERE uuid = $uuid;`,
                note
            );   
            await this.resetTaskDevices(client, note.uuid, deviceId);                        
            await client.query('COMMIT;');
        } catch(err) {
            console.log(err);
        } finally {
            client.release();
        }
    }

    

    // synchronization 

    async getNewNotes(deviceId, userId) {   
        try {
            let res = await this.db.query(`
                SELECT 
                    id, 
                    uuid, 
                    title, 
                    starttime as "startTime", 
                    endtime as "endTime", 
                    notificate, 
                    tag, 
                    dynamicfields as "dynamicFields", 
                    added, 
                    finished, 
                    td.userId as "userId", 
                    lastAction as "lastAction", 
                    lastActionTime as "lastActionTime"
                FROM tasks_devices td
                JOIN tasks t ON t.uuid = td.taskuuid
                WHERE td.deviceid != $deviceId AND td.userId = $userId AND td.taskuuid != ALL 
                (
                    SELECT taskuuid FROM tasks_devices
                    WHERE deviceid = $deviceId AND userId = $userId
                );
            `, {
                deviceId,
                userId
            });

            return res.rows;
        } catch (err) {
            console.log(err);
            return [];
        }  
    }

    async applyLocalChanges(notes, deviceId, userId) {
        if (!notes) {
            return
        }

        try {
            notes.forEach(async (note) => {
                if (note.lastAction === "ADD") {
                    await this.addNote(note, deviceId, userId);
                } else {
                    if (!note.isSynced) {
                        await this.addNote(note, deviceId, userId);
                    }

                    if (note.lastAction === "DELETE") {
                        await this.deleteNote(note, deviceId);
                    } else {
                        await this.updateNote(note, deviceId, userId)
                    }
                }
            });
        } catch(err) {
            console.log(err);
        }
    }

    resetTaskDevices(client, taskUUID, deviceId) {
        client = client || this.db;

        return client.query(
            `DELETE FROM tasks_devices
            WHERE taskUUID = $taskUUID AND deviceid != $deviceId;`,
            {
                taskUUID,
                deviceId
            }
        );
    }

    setTaskDevice(client, taskUUID, deviceId, userId) {
        client = client || this.db;

        return client.query(
            `INSERT INTO tasks_devices
            (taskUUID, deviceId, userId)
            VALUES($taskUUID, $deviceId, $userId);`,
            {
                taskUUID,
                deviceId,
                userId
            }
        );
    }

    setMultiplieTaskDevces(taskUUIDs, deviceId, userId) {
        if (!taskUUIDs || !taskUUIDs.length) {
            return
        }

        let sqlInsertValuesQuery = "";
        taskUUIDs.forEach((el, i) => {
            let str;
            if (taskUUIDs.length - 1 === i) {
                str = `('${el}', '${deviceId}', ${userId});`;   
            } else {
                str = `('${el}', '${deviceId}', ${userId}),`;                   
            };
            sqlInsertValuesQuery += str;
        })

        return this.db.query(
            `INSERT INTO tasks_devices
            (taskUUID, deviceId, userId)
            VALUES
            ${sqlInsertValuesQuery}`
        );
    }

    checkNoteExisting(client, note) {
        client = client || this.db;
        return client.query(
            `SELECT id 
            FROM Tasks
            WHERE uuid = $uuid;`,
            { uuid: note.uuid }
        )
    }



    // backup

    async saveBackup(notes, userId) {
        if (!notes || !notes.length) {
            return;
        }

        this.db.query(`DELETE FROM NotesBackups;`);

        let date = new Date();
        let insertValues = notes.map((note) => [note.uuid, note, userId, date]);
        let insertSQL = format(`INSERT INTO NotesBackups (uuid, note, userId, datetime) VALUES %L`, insertValues);
        let insert = await this.db.query(insertSQL);

        return insert;
    }

    async saveBackupPart(notes, userId) {
        if (!notes || !notes.length) {
            return;
        }
        let date = new Date();
        let valuesToInsert = notes
            .filter((note) => !note.isSynced && note.lastAction !== 'CLEAR')
            .map((note) => {
                return [note.uuid, note, userId, date];
            });
        let valuesToUpdate = notes
            .filter((note) => note.isSynced && note.lastAction !== 'CLEAR')
            .map((note) => {
                return [note.uuid, note, userId, date];
            });
        let valuesToDelete = notes
            .filter((note) => note.isSynced && note.lastAction === 'CLEAR')
            .reduce((acc, note) => {
                return [...acc, note.uuid];
            }, []);

        if (valuesToInsert.length) {
            let insertSQL = format(`INSERT INTO NotesBackups (uuid, note, userId, datetime) VALUES %L`, valuesToInsert);
            await this.db.query(insertSQL);
        }

        if (valuesToUpdate.length) {
            let updateSQL = format(`            
                UPDATE NotesBackups as nb
                SET
                uuid = n.uuid,
                    note = n.note,
                    userId = n.userId::int,
                    datetime = n.datetime::timestamp with time zone
                FROM (VALUES %L) as n (uuid, note, userId, datetime)
                WHERE nb.uuid = n.uuid;
            `, valuesToUpdate);
            await this.db.query(updateSQL);
        }

        if (valuesToDelete.length) {
            let deleteSQL = format(`DELETE FROM NotesBackups WHERE uuid IN (%L)`, valuesToDelete);
            await this.db.query(deleteSQL);
        }
    }

    async getUserBackups(userId) {
        let select = await this.db.query(`
            SELECT note 
            FROM NotesBackups
            WHERE userId = $userId
        `, {userId});

        return select.rows;
    }

    async getUserLastBackupTime(userId) {
        let select = await this.db.query(`
            SELECT datetime
            FROM NotesBackups
            WHERE userId = $userId
            ORDER BY datetime
            Limit 1
        `, {userId});

        return select.rows[0] ? select.rows[0].datetime : null;
    }
};