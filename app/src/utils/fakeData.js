import moment from "moment";
import execureSQL from "../utils/executeSQL";
import getUTCOffset from "./getUTCOffset";
import {NoteRepeatType} from "../constants";

import DogImg from "../assets/img/initial-note-example-image.jpg"

export async function addFakeListItemsData () {
    console.log("Start adding test data");

    let dates = generateDates(moment().startOf("day").valueOf() + getUTCOffset(), 100);
    let sequence = generateSequence(10);  
    
    let dynamicDataJson = `[{"type":"text","value":"Where rt"},{"type":"listItem","value":"Xc","checked":false},{"type":"listItem","value":"Cvvb","checked":false},{"type":"listItem","value":"Cbnjknh","checked":true},{"type":"listItem","value":"Cbbnj","checked":false},{"type":"text","value":"Vhhjhh"},{"type":"snapshot","value":"${DogImg}"}]`;

    for (let date of dates) {
        for (let i of sequence) {     
            await execureSQL(
                `INSERT INTO Notes
                (title, startTime, endTime, isNotificationEnabled, tag, contentItems, date, lastAction, forkFrom, repeatType, mode)
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                [new Date(date).toDateString(), +new Date(date + (i * 10000)), +new Date(date + (i * 100000)), 0, "transparent", dynamicDataJson, date, "ADD", null, NoteRepeatType.NoRepeat, 1]
            );  
        }
    }

    console.log("Test data added");
}

function generateDates (initial, expand) {
    let dates = [];

    for(let i = 0; i < expand; i++) {
        dates.push(initial - (86400000 * i));
        dates.reverse();
        dates.push(initial + (86400000 * i));
    };
    return dates;
}

function generateSequence(n) {
    let sequence = [];
    for(let i = 1; i < n; i++) {
        sequence.push(i);
    };
    return sequence;
}