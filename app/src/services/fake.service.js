import moment from "moment";
import execureSQL from "../utils/executeSQL";

class FakeService {
    async addFakeListItemsData () {
        let dates = this.generateDates(moment().startOf("day").valueOf(), 10);
        let sequence = this.generateSequence(10);  
        
        let dynamicDataJson = `[{"type":"text","value":"Where rt"},{"type":"listItem","value":"Xc","checked":false},{"type":"listItem","value":"Cvvb","checked":false},{"type":"listItem","value":"Cbnjknh","checked":true},{"type":"listItem","value":"Cbbnj","checked":false},{"type":"text","value":"Vhhjhh"},{"type":"snapshot","uri":"/storage/emulated/0/DCIM/P71202-160439.jpg"}]`;
    
        for (let date of dates) {
            for (let i of sequence) {     
                await execureSQL(
                    `INSERT INTO Tasks
                    (title, startTime, endTime, notificate, tag, dynamicFields, added, userId, lastAction)
                    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                    [new Date(date).toDateString(), +new Date(date + (i * 10000)), +new Date(date + (i * 100000)), 0, "transparent", dynamicDataJson, date, 3, "ADD"]
                );  
            }
        };
    
        console.log("Test data added");
    }
    
    generateDates (initial, expand) {
        let dates = [];
    
        for(let i = 0; i < expand; i++) {
            dates.push(initial - (86400000 * i));
            dates.reverse();
            dates.push(initial + (86400000 * i));
        };
        return dates;
    }
    
    generateSequence(n) {
        let sequence = [];
        for(let i = 1; i < n; i++) {
            sequence.push(i);
        };
        return sequence;
    }
}

let fakeService = new FakeService();

export default fakeService;