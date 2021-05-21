import React, {PureComponent} from 'react';
import {CalendarNotesCounterMode} from "../../../constants";

export default class WeekDatesRow extends PureComponent {
    render() {
        return (
            <div className="light-calendar-swiper-item">
                {
                    this.props.week.map((date, i) => {
                        let msDate = date.valueOf();
                        let active = this.props.msSelectedDate === msDate;
                        let count = this.props.count[msDate];

                        return (
                            <button
                                className={`light-calendar-date${active ? ' active' : ''}`}
                                key={i}
                                onClick={() => this.props.onSelect(date)}
                            >
                                {
                                    (this.props.calendarNotesCounterMode !== CalendarNotesCounterMode.NotShow && count) &&
                                    <span className="count">
                                        {
                                            this.props.calendarNotesCounterMode === CalendarNotesCounterMode.All &&
                                            <React.Fragment>
                                                {
                                                    count.finished !== 0 &&
                                                    <span className="c-success">{count.finished}</span>
                                                }
                                                {(count.notFinished !== 0 && count.finished !== 0) && "|"}
                                            </React.Fragment>
                                        }
                                        {
                                            count.notFinished !== 0 &&
                                            <span className="c-warn">{count.notFinished}</span>
                                        }
                                    </span>
                                }
                                <span className="light-calendar-date-number">{date.format("DD")}</span>
                            </button>
                        ) 
                    })
                }
            </div>
        )
    }
}