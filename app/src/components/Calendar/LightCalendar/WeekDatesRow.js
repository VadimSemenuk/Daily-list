import React, {PureComponent} from 'react';
import {CalendarDate} from "../Common/Calendar Date/CalendarDate";

export default class WeekDatesRow extends PureComponent {
    render() {
        return (
            <div className="light-calendar-swiper-item">
                {
                    this.props.week.map((date, i) => {
                        let msDate = date.valueOf();
                        let active = this.props.msSelectedDate === msDate;

                        return (
                            <CalendarDate
                                key={i}
                                isActive={active}
                                count={this.props.count[msDate]}
                                date={date}
                                notesCounterMode={this.props.calendarNotesCounterMode}
                                onClick={this.props.onSelect}
                            />
                        ) 
                    })
                }
            </div>
        )
    }
}