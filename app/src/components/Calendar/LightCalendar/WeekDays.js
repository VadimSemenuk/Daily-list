import React, {PureComponent} from 'react';
import moment from "moment";

let weekDays = moment.weekdaysMin(true);

export default class WeekDays extends PureComponent {
    render() {
        return (
            <div className="week-days">
                {
                    weekDays.map((day, i) => <span key={i}>{day}</span>)
                }                  
            </div>
        )
    }
}