module.exports = class {
    constructor(db, notesRep) {
        this.db = db;
        this.notesRep = notesRep;
    }

    async getNewNotes(deviceId, userId) {   
        try {
            let res = await this.db.query(`
                SELECT id, uuid, title, starttime, endtime, notificate, tag, dynamicfields, added, finished, td.userId as userId, lastAction, lastActionTime
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
                if (note.lastAction === "DELETE") {
                    await this.notesRep.deleteNote();
                } else {
                    await this.notesRep.addNote(note, deviceId, userId);
                }
            });
        } catch(err) {
            console.log(err);
        }
    }

    resetTaskDevices(client, taskUUID, deviceId) {
        return client.query(
            `DELETE FROM tasks_devices
            WHERE taskUUID = $taskUUID AND deviceid != $deviceId;`,
            {
                taskUUID,
                deviceId
            }
        );
    }

    setTaskDevces(taskUUIDs, deviceId, userId) {
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

        this.db.query(
            `INSERT INTO tasks_devices
            (taskUUID, deviceId, userId)
            VALUES
            ${sqlInsertValuesQuery}`
        );
    }
}