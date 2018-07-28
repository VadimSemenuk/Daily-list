import React, {PureComponent} from 'react';

export default class WeekDatesRow extends PureComponent {
    render() {
        return (
            <div className="light-calendar-swiper-item">
                {
                    this.props.week.map((date, i) => {
                        const active = this.props.visible && this.props.selectedDayNumber === i;

                        return (
                            <button 
                                className={`light-calendar-date ${active ? 'active' : ''}`}
                                key={i} 
                                onClick={() => this.props.onSelect(i, date)}
                            >        
                                <span className="light-calendar-date-number">{date.format("DD")}</span>                            
                            </button> 
                        ) 
                    })
                }
            </div>
        )
    }
}