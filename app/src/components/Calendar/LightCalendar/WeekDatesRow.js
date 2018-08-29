import React, {PureComponent} from 'react';

export default class WeekDatesRow extends PureComponent {
    render() {
        return (
            <div className="light-calendar-swiper-item">
                {
                    this.props.week.map((date, i) => {
                        let msDate = date.valueOf();
                        let active = this.props.msSelectedDate === msDate;
                        let count = this.props.count[msDate] || 0;

                        return (
                            <button 
                                className={`light-calendar-date ${active ? 'active' : ''}`}
                                key={i} 
                                onClick={() => this.props.onSelect(date)}
                            >     
                                <span className="count">{count}</span>   
                                <span className="light-calendar-date-number">{date.format("DD")}</span>                            
                            </button> 
                        ) 
                    })
                }
            </div>
        )
    }
}