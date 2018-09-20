import React, {PureComponent} from 'react';

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
                                    week.map((weekDay, i) => {
                                        if (!weekDay) {
                                            return <div key={i} className="calendar-date"></div>
                                        }

                                        let active;
                                        let msCurrentDay = weekDay.valueOf();
                                        if (this.props.mode === "multiselect") {
                                            active = ~this.props.msSelectedDates.findIndex((a) => a === msCurrentDay);
                                        } else {
                                            active = msCurrentDay === this.props.msSelectedDate;
                                        }

                                        let count = null;
                                        if (this.props.calendarNotesCounter) {
                                            count = this.props.count[msCurrentDay] || 0;
                                            count += this.props.repeatable.day || 0; 
                                            count += this.props.repeatable.week[i + 1] || 0;
                                            count += this.props.repeatable.any[msCurrentDay] || 0;
                                        }

                                        return (
                                            <button 
                                                className={`calendar-date${active ? ' active' : ''}`}
                                                key={i} 
                                                onClick={() => this.props.onSelect(weekDay, active)}
                                            >
                                                {this.props.calendarNotesCounter ? <span className="count theme-contrasting-color">{count}</span> : null} 
                                                {weekDay.format('DD')}
                                            </button> 
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