export default async (query, parametrs) => {
    return new Promise((resolve, reject) => {
        let res;
        window.db.transaction((tx) => {
            tx.executeSql(query, parametrs, (tx, rs) => res = rs)
        }, reject, () => resolve(res))
    })  
}