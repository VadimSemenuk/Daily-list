import React, {Component} from 'react';
import ReactSwipe from 'react-swipe';
import moment from 'moment';

import './LightCalendar.scss';

import WeekDatesRow from "./WeekDatesRow";

const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default class LightCalendar extends Component {
    constructor(props) {
        super(props);

        const weeks = this.generateWeeksSequence();

        this.state = {
            weeks,
            selectedDayNumber: moment(this.props.currentDate).isoWeekday() - 1,
            selectedWeekStartDate: moment(this.props.currentDate).startOf('isoWeek').valueOf(),

            monthName: this.getMonthName(weeks[1][0], weeks[1][6])
        }

        this.activePageIndex = 1;  
        this.prevPageIndex = 1;
    }

    generateWeekDate(date, weekDayNumber) {
        return {
            monthDayNumber: date.date(),
            msDate: date.valueOf()
        }
    }

    generateWeekDates(dateOfWeek) {
        let weekStartDate = moment(dateOfWeek).startOf('isoWeek');
        let weekDates = [this.generateWeekDate(weekStartDate, 0)];
        for (let a = 2; a < 8; a++) {
            weekDates.push(this.generateWeekDate(moment(weekStartDate).day(a), a - 1));
        }
        return weekDates;
    }

    generateWeeksSequence(dateOfWeek) {
        return [
            this.generateWeekDates(moment(dateOfWeek).subtract(1, 'week')),
            this.generateWeekDates(moment(dateOfWeek)),
            this.generateWeekDates(moment(dateOfWeek).add(1, 'week')),            
        ]
    }

    onSlideChange = ({index, nextIndex, side}) => {       
        let weeks = this.state.weeks.slice();

        if (side === "left") {        
            weeks[nextIndex] = this.generateWeekDates(moment(weeks[index][0].msDate).add(-1, 'week'));                       
        } else {   
            weeks[nextIndex] = this.generateWeekDates(moment(weeks[index][0].msDate).add(1, 'week'));
        }

        const monthName = this.getMonthName(weeks[index][0], weeks[index][6])
        
        this.setState({
            weeks,
            monthName
        })
    }

    getMonthName(startWeekDate, endWeekDate) {
        let weekStartDayMonthName = moment(startWeekDate.msDate).format('MMMM');
        let weekEndDayMonthName;      
        
        if (startWeekDate.monthDayNumber > endWeekDate.monthDayNumber) {
            weekEndDayMonthName = moment(endWeekDate.msDate).format('MMMM');
            return `${weekStartDayMonthName} - ${weekEndDayMonthName}`
        } else {
            return weekStartDayMonthName
        }
    }

    setDate = (selectedDayNumber, selectedDayDate) => {
        this.setState({
            selectedDayNumber, 
            selectedWeekStartDate: moment(selectedDayDate).startOf("isoWeek").valueOf()
        })
    }

    // componentWillReceiveProps(nextProps) {
    //     let selectedWeekStartDate = moment(nextProps.currentDate).startOf('isoWeek').valueOf();
    //     let selectedDay = moment(nextProps.currentDate).isoWeekday();   

    //     if (selectedWeekStartDate === this.state.data[this.activePageIndex].valueOf()) {
    //         this.setState({selectedDay, selectedWeekStartDate});
    //     } else {
    //         let initDates;
    //         if (this.activePageIndex === 2) {
    //             initDates = [
    //                 moment(nextProps.currentDate).startOf('isoWeek'),
    //                 moment(nextProps.currentDate).add(1, 'week').startOf('isoWeek'),
    //                 moment(nextProps.currentDate).subtract(1, 'week').startOf('isoWeek')
    //             ]
    //         } else if (this.activePageIndex === 0) {
    //             initDates = [
    //                 moment(nextProps.currentDate).subtract(1, 'week').startOf('isoWeek'),
    //                 moment(nextProps.currentDate).startOf('isoWeek'),
    //                 moment(nextProps.currentDate).add(1, 'week').startOf('isoWeek')
    //             ]
    //         } else {
    //             initDates = [
    //                 moment(nextProps.currentDate).add(1, 'week').startOf('isoWeek'),
    //                 moment(nextProps.currentDate).subtract(1, 'week').startOf('isoWeek'), 
    //                 moment(nextProps.currentDate).startOf('isoWeek')
    //             ]
    //         }

    //         this.setState({
    //             data: initDates,
    //             selectedDay,
    //             selectedWeekStartDate
    //         }, () => {
    //             if (selectedWeekStartDate > this.state.data[this.activePageIndex].valueOf()) {
    //                 this.sliderRef.next();
    //             } else if (selectedWeekStartDate < this.state.data[this.activePageIndex].valueOf()) {
    //                 this.sliderRef.prev();            
    //             }
    //         })
    //     }
    // }

    setSliderRef = (a) => {
        this.sliderRef = a;
    }

    render() {
        return (
            <div  
                className="light-calendar-wrapper"
                style={{background: this.props.settings.theme.header, borderColor: this.props.settings.theme.header}}
            >
                <div className="light-calendar-month">{this.state.monthName}</div>
                <ReactSwipe
                    ref={this.setSliderRef}
                    className="light-calendar-swiper"
                    swipeOptions={{
                        continuous: true,
                        startSlide: 1,
                        callback: this.onSliderChange
                    }} 
                    key={this.state.weeks.length}
                >
                    {
                        this.state.weeks.map((week, i) => {
                            const visible = week[0].msDate === this.state.selectedWeekStartDate;                                                                                 

                            return (
                                <div key={i}>
                                    <WeekDatesRow 
                                        week={week} 
                                        visible={visible}
                                        selectedDayNumber={this.state.selectedDayNumber}
                                        
                                        onSelect={this.setDate} 
                                    />
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