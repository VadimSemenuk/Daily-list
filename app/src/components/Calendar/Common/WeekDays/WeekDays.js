import React, {PureComponent} from 'react';
import moment from "moment";

import './WeekDays.scss';

export default class WeekDays extends PureComponent {
    constructor(props) {
        super(props);

        this.weekDays = moment.weekdaysMin(true);
    }

    render() {
        return (
            <div className="calendar-week-days">
                {
                    this.weekDays.map((day, i) => <span key={i}>{day}</span>)
                }                  
            </div>
        )
    }
}