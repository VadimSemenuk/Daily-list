import React, {PureComponent} from 'react';

export default class LightCalendar extends PureComponent {
    render() {
        return (
            <div 
                key={i}
                className="light-calendar-swiper-item"
            >
                {
                    week.map((date, i) => {
                        let active = visible && this.state.selectedDayNumber === i;

                        return (
                            <button 
                                className={`light-calendar-date ${active ? 'active' : ''}`}
                                key={i} 
                                onClick={() => this.setDate(i, date)}
                            >        
                                <span className="light-calendar-date-number">{date.monthDayNumber}</span>                            
                            </button> 
                        ) 
                    })
                }
            </div>
        )
    }
}