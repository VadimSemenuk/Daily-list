import React, {PureComponent} from 'react';

const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default class WeekDays extends PureComponent {
    render() {
        return (
            <div className="week-days">
                {
                    days.map((day, i) => <span key={i}>{day}</span>)
                }                  
            </div>
        )
    }
}