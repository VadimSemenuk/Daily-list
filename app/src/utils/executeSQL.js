export default async (query, props) => {
    return new Promise((resolve, reject) => {
        let res;
        window.com_mamindeveloper_dailylist_db.transaction((tx) => {
            // console.log(query);
            tx.executeSql(query, props, (tx, rs) => res = rs)
        }, reject, () => resolve(res))
    })  
}