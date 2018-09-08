import moment from "moment";

export function getDayPartName() {
	const SPLIT_MORNING = 7;
	const SPLIT_AFTERNOON = 12;
    const SPLIT_EVENING = 17;
    const SPLIT_NIGHT = 24;
    const SPLIT_DAY_START = 0;
    let currentHour = parseFloat(moment().format("HH"));    
    
    if (currentHour >= SPLIT_AFTERNOON && currentHour <= SPLIT_EVENING) {
        return {
            part: 1,
            name: "afternoon",
            namePhrase: "g-afternoon"
        }
    }
    if (currentHour > SPLIT_EVENING && currentHour < SPLIT_NIGHT) {
        return {
            part: 2,
            name: "evening",
            namePhrase: "g-evening"
        }
    }
    if (currentHour >= SPLIT_DAY_START && currentHour <= SPLIT_MORNING) {
        return {
            part: 3,
            name: "night",
            namePhrase: "g-night"
        }
    }
    if (currentHour > SPLIT_MORNING && currentHour < SPLIT_AFTERNOON) {
        return {
            part: 0,
            name: "morning",
            namePhrase: "g-morning"
        }
    }
}

export function getGreeting() {
    return getDayPartName().namePhrase;
}