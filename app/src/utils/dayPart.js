import moment from "moment";

export function getDayPartName(m = moment()) {	
	if(!m || !m.isValid()) { return; } 
	
	var split_afternoon = 12;
	var split_evening = 17;
	var currentHour = parseFloat(m.format("HH"));
	
	if(currentHour >= split_afternoon && currentHour <= split_evening) {
		return {
            part: 1,
            name: "день"
        };
	} else if(currentHour >= split_evening) {
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