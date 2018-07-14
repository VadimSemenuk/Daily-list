let insert = (note) => {
    return executeSQL(
        `INSERT INTO Tasks
        (uuid, title, startTime, endTime, notificate, tag, dynamicFields, added, lastAction, lastActionTime, userId, isSynced)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
            note.uuid,
            note.title, 
            note.startTime, 
            note.endTime, 
            note.notificate, 
            note.tag, 
            note.dynamicFields, 
            note.added,
            note.lastAction,
            note.lastActionTime,
            note.userId,
            note.isSynced
        ]
    ).catch((err) => console.warn(err));
}

export default {
    insert
}