import React, {PureComponent} from 'react';
import moment from "moment";

export default class WeekDays extends PureComponent {
    constructor(props) {
        super(props);

        this.weekDays = moment.weekdaysMin(true);
    }

    render() {
        return (
            <div className="week-days">
                {
                    this.weekDays.map((day, i) => <span key={i}>{day}</span>)
                }                  
            </div>
        )
    }
}