import moment from "moment";

export function getDayPartName(m = moment()) {	
	if(!m || !m.isValid()) { return; } 
	
	var splitAfternoon = 12;
	var splitEvening = 17;
	var currentHour = parseFloat(m.format("HH"));
	
	if(currentHour >= splitAfternoon && currentHour <= splitEvening) {
		return {
            part: 1,
            name: "день"
        };
	} else if(currentHour >= splitEvening) {
        return {
            part: 2,
            name: "вечер"
        }
	} else {
		return {
            part: 0,
            name: "утро"
        }
	}
}

export function getGreeting() {
    let dayPart = getDayPartName();

    if (dayPart.part === 1) {
        return `Добрый ${dayPart.name}`
    } else if (dayPart.part === 2) {
        return `Добрый ${dayPart.name}`        
    } else if (dayPart.part === 3) {
        return `Доброе ${dayPart.name}`        
    }
}