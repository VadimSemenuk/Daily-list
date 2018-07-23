import React, {Component} from 'react';
import ReactSwipe from 'react-swipe';
import moment from 'moment';

import './LightCalendar.scss';

export default class LightCalendar extends Component {
    constructor(props) {
        super(props);

        let initDates = [
            moment(this.props.currentDate).subtract(1, 'week').startOf('isoWeek'), 
            moment(this.props.currentDate).startOf('isoWeek'), 
            moment(this.props.currentDate).add(1, 'week').startOf('isoWeek')
        ]

        this.state={
            data: initDates,
            selectedDay: moment(this.props.currentDate).isoWeekday(),
            selectedWeekStartDate: initDates[1].valueOf(),
            weekDates: this.getWeekDates()
        }

        this.activePageIndex = 1;  
        this.prevPageIndex = 1;
    }

    getWeekDates() {
        // start date++ 7 times
        return [
            [21, 22, 23, 24, 25, 26, 27],
            [21, 22, 23, 24, 25, 26, 27],
            [21, 22, 23, 24, 25, 26, 27]            
        ]
    }

    setDate(selectedDay, selectedWeekStartDate, date) {
        this.setState({selectedDay, selectedWeekStartDate})

        this.props.onDateSet(date);
    }

    onSlideChange = ({index, nextIndex, side}) => {       
        let data = this.state.data.slice();

        if (side === "left") {      
            data[nextIndex] = moment(data[index]).add(-1, 'week');           
        } else {   
            data[nextIndex] = moment(data[index]).add(1, 'week');
        }

        this.setState({data})
    }

    getMonthName() {
        let weekStartMonthName = moment(this.state.data[this.activePageIndex]).locale("ru").format('MMMM');  
        let weekEndMonthName = moment(this.state.data[this.activePageIndex]).day(7).locale("ru").format('MMMM');
        
        if (weekStartMonthName === weekEndMonthName) {
            return weekStartMonthName
        } else {
            return `${weekStartMonthName} - ${weekEndMonthName}`
        }
    }

    componentWillReceiveProps(nextProps) {
        let selectedWeekStartDate = moment(nextProps.currentDate).startOf('isoWeek').valueOf();
        let selectedDay = moment(nextProps.currentDate).isoWeekday();   

        if (selectedWeekStartDate === this.state.data[this.activePageIndex].valueOf()) {
            this.setState({selectedDay, selectedWeekStartDate});
        } else {
            let initDates;
            if (this.activePageIndex === 2) {
                initDates = [
                    moment(nextProps.currentDate).startOf('isoWeek'),
                    moment(nextProps.currentDate).add(1, 'week').startOf('isoWeek'),
                    moment(nextProps.currentDate).subtract(1, 'week').startOf('isoWeek')
                ]
            } else if (this.activePageIndex === 0) {
                initDates = [
                    moment(nextProps.currentDate).subtract(1, 'week').startOf('isoWeek'),
                    moment(nextProps.currentDate).startOf('isoWeek'),
                    moment(nextProps.currentDate).add(1, 'week').startOf('isoWeek')
                ]
            } else {
                initDates = [
                    moment(nextProps.currentDate).add(1, 'week').startOf('isoWeek'),
                    moment(nextProps.currentDate).subtract(1, 'week').startOf('isoWeek'), 
                    moment(nextProps.currentDate).startOf('isoWeek')
                ]
            }

            this.setState({
                data: initDates,
                selectedDay,
                selectedWeekStartDate
            }, () => {
                if (selectedWeekStartDate > this.state.data[this.activePageIndex].valueOf()) {
                    this.sliderRef.next();
                } else if (selectedWeekStartDate < this.state.data[this.activePageIndex].valueOf()) {
                    this.sliderRef.prev();            
                }
            })
        }
    }

    setSliderRef = (a) => {
        this.sliderRef = a;
    }

    render() {
        return (
            <div  
                className="light-calendar-wrapper"
                style={{background: this.props.settings.theme.header, borderColor: this.props.settings.theme.header}}
            >
                <div className="light-calendar-month">{this.getMonthName()}</div>
                <ReactSwipe
                    ref={this.setSliderRef}
                    className="light-calendar-swiper"
                    swipeOptions={{
                        continuous: true,
                        startSlide: 1,
                        callback: this.onSliderChange
                    }} 
                    key={this.state.data.length}
                >
                    {
                        this.state.data.map((starWeektDate, i) => {
                            let visible = starWeektDate.valueOf() === this.state.selectedWeekStartDate;

                            return (
                                <div 
                                    key={i}
                                    className="light-calendar-swiper-item"
                                >
                                    {
                                        this.state.weekDates[i].map((a, i) => {
                                            let active = visible && this.state.selectedDay === a;

                                            return (
                                                <button 
                                                    className={`light-calendar-date ${active ? 'active' : ''}`}
                                                    key={i} 
                                                    onClick={() => this.setDate(a, starWeektDate.valueOf(), date)}
                                                >        
                                                    {   
                                                        false 
                                                        &&
                                                        <span className="light-calendar-date-day">{days[i]}</span>
                                                    }
                                                    <span className="light-calendar-date-number">{date}</span>                            
                                                </button> 
                                            ) 
                                        })
                                    }
                                </div>
                            )
                        })
                    }             
                </ReactSwipe>  
            </div>
        )
    }

    onSliderChange = (a, event) => {             
        let action = this.getSlideAction(a);                
        this.onSlideChange(action);
    }

    getSlideAction = (index) => {
        if (index === 0 && this.activePageIndex === 2) {
            return this.onSliderRigth(index);
        } else if (index === 2 && this.activePageIndex === 0) {
            return this.onSliderLeft(index);
        } else if (this.activePageIndex < index) {
            return this.onSliderRigth(index);                
        } else if (this.activePageIndex > index) {
            return this.onSliderLeft(index);                
        } else if (this.prevPageIndex > index) {          
            return this.onSliderRigth(index);   
        } else if (this.prevPageIndex < index) {                      
            return this.onSliderLeft(index);            
        }
    }

    onSliderRigth = (index) => {                                                                                             
        let nextIndex = index + 1;
        if (nextIndex > 2) {
            nextIndex = 0;
        };
        this.prevPageIndex = this.activePageIndex;
        this.activePageIndex = index; 
        return {
            index, nextIndex, 
            side: 'right'
        }
    }

    onSliderLeft = (index) => {                                                                    
        let nextIndex = index - 1;
        if (nextIndex < 0) {
            nextIndex = 2;
        };
        this.prevPageIndex = this.activePageIndex;        
        this.activePageIndex = index; 
        return {
            index, nextIndex, 
            side: 'left'
        }
    }
}