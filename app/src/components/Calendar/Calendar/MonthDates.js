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

                                        let active
                                        if (this.props.mode === "multiselect") {
                                            let msCurrentDay = weekDay.valueOf();
                                            active = ~this.props.msSelectedDates.findIndex((a) => a === msCurrentDay);
                                        } else {
                                            active = weekDay.valueOf() === this.props.msSelectedDate;
                                        }

                                        return (
                                            <button 
                                                className={`calendar-date ${active ? 'active' : ''}`}
                                                key={i} 
                                                onClick={() => this.props.onSelect(weekDay, active)}
                                            >{weekDay.format('DD')}</button> 
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