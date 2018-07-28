import React, {Component} from 'react';
import ReactSwipe from 'react-swipe';
import moment from 'moment';

import './LightCalendar.scss';

import WeekDatesRow from "./WeekDatesRow";

import sliderChangeSide from "../../../utils/sliderChangeSide";

export default class LightCalendar extends Component {
    constructor(props) {
        super(props);

        const currentDate = moment(this.props.currentDate);
        const weeks = this.generateWeeksSequence(currentDate.startOf('isoWeek'));

        this.state = {
            weeks,
            selectedDayNumber: currentDate.isoWeekday() - 1,
            selectedWeekStartDate: currentDate.startOf('isoWeek').valueOf(),
            monthName: this.getMonthName(weeks[1][0], weeks[1][6])
        }

        this.activePageIndex = 1;  
        this.prevPageIndex = 1;
    }

    generateWeekDates(weekStartDate) {
        let weekDates = [weekStartDate];
        for (let a = 2; a < 8; a++) {
            weekDates.push(moment(weekStartDate).day(a));
        }
        return weekDates;
    }

    generateWeeksSequence(weekStartDate) {
        return [
            this.generateWeekDates(moment(weekStartDate).subtract(1, 'week')),
            this.generateWeekDates(moment(weekStartDate)),
            this.generateWeekDates(moment(weekStartDate).add(1, 'week')),            
        ]
    }

    onSlideChange = ({index, nextIndex, side}) => {   
        let weeks = this.state.weeks.slice();

        if (side === "left") {        
            weeks[nextIndex] = this.generateWeekDates(moment(weeks[index][0]).add(-1, 'week'));                       
        } else {   
            weeks[nextIndex] = this.generateWeekDates(moment(weeks[index][0]).add(1, 'week'));
        }

        const monthName = this.getMonthName(weeks[index][0], weeks[index][6])
        
        this.setState({
            weeks,
            monthName
        })
    }

    getMonthName(startWeekDate, endWeekDate) {
        const weekStartDayMonthName = startWeekDate.locale("ru").format('MMMM');   
        const weekEndDayMonthName = endWeekDate.locale("ru").format('MMMM');
        
        if (weekStartDayMonthName !== weekEndDayMonthName) {
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

        this.props.onDateSet(moment(selectedDayDate));
    }

    // componentWillReceiveProps(nextProps) {
    //     let selectedWeekStartDate = moment(nextProps.currentDate).startOf('isoWeek').valueOf();
    //     let selectedDayNumber = moment(nextProps.currentDate).isoWeekday();   

    //     if (selectedWeekStartDate === this.state.weeks[this.activePageIndex][0].msDate) {
    //         this.setState({
    //             selectedDayNumber, 
    //             selectedWeekStartDate
    //         });
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

    onSliderChange = (e) => {
        const action = sliderChangeSide(e, this.activePageIndex, this.prevPageIndex);
        this.prevPageIndex = action.prevPageIndex;
        this.activePageIndex = action.activePageIndex;

        this.onSlideChange(action);
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
                            const visible = week[0].valueOf() === this.state.selectedWeekStartDate;                                                                                 

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
}