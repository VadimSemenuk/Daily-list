import React, {PureComponent} from 'react';
import {CalendarDate, EmptyCalendarDate} from "../Common/Calendar Date/CalendarDate";

export default class MonthDates extends PureComponent {
    render() {
        return (
            <div className="calendar-month-container">
                {
                    this.props.monthWeeks.map((week, i) => {
                        return (
                            <div
                                key={i}
                                className="calendar-week"
                            >
                                {
                                    week.map((date, i) => {
                                        if (!date) {
                                            return <EmptyCalendarDate key={i} />
                                        }

                                        let msDate = date.valueOf();
                                        let isActive;
                                        if (this.props.mode === "multiselect") {
                                            isActive = ~this.props.msSelectedDates.findIndex((a) => a === msDate);
                                        } else {
                                            isActive = msDate === this.props.msSelectedDate;
                                        }

                                        return (
                                            <CalendarDate
                                                key={i}
                                                isActive={isActive}
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
                    })
                } 
            </div> 
        )
    }
}