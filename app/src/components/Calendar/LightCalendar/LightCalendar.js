import React, {Component} from 'react';
import ReactSwipe from 'react-swipe';
import moment from 'moment';

import './LightCalendar.scss';

import WeekDatesRow from "./WeekDatesRow";

import sliderChangeSide from "../../../utils/sliderChangeSide";

export default class LightCalendar extends Component {
    constructor(props) {
        super(props);

        let msSelectedDate = moment(this.props.currentDate).startOf("day").valueOf();
        let weeks = this.generateWeeksSequence(moment(msSelectedDate).startOf('isoWeek'));

        this.state = {
            weeks,
            msSelectedDate,
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
            this.generateWeekDates(moment(weekStartDate).add(1, 'week'))         
        ]
    }

    onSlideChange = ({index, nextIndex, side}) => {   
        let weeks = this.state.weeks.slice();

        if (side === "left") {        
            weeks[nextIndex] = this.generateWeekDates(moment(weeks[index][0]).subtract(1, 'week'));                       
        } else {   
            weeks[nextIndex] = this.generateWeekDates(moment(weeks[index][0]).add(1, 'week'));
        }

        let monthName = this.getMonthName(weeks[index][0], weeks[index][6]);
        
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

    setDate = (date) => {
        this.setState({
            msSelectedDate: date.valueOf()
        })

        this.props.onDateSet(moment(date));
    }

    componentWillReceiveProps(nextProps) {
        let msSelectedWeekStartDate = moment(nextProps.currentDate).startOf('isoWeek').valueOf();

        if (msSelectedWeekStartDate === this.state.weeks[this.activePageIndex][0].valueOf()) {
            this.setState({
                msSelectedDate: nextProps.currentDate.valueOf()
            });
        } else {
            let weeks;

            let currentWeekStartDate = moment(msSelectedWeekStartDate);
            let prevWeekStartDate = moment(msSelectedWeekStartDate).subtract(1, 'week');
            let nextWeekStartDate = moment(msSelectedWeekStartDate).add(1, 'week');

            if (this.activePageIndex === 2) {
                weeks = [this.generateWeekDates(currentWeekStartDate), this.generateWeekDates(nextWeekStartDate), this.generateWeekDates(prevWeekStartDate)];
            } else if (this.activePageIndex === 0) {
                weeks = [this.generateWeekDates(prevWeekStartDate), this.generateWeekDates(currentWeekStartDate), this.generateWeekDates(nextWeekStartDate)];
            } else {
                weeks = [this.generateWeekDates(nextWeekStartDate), this.generateWeekDates(prevWeekStartDate), this.generateWeekDates(currentWeekStartDate)];
            }

            let monthName = this.getMonthName(weeks[this.activePageIndex][0], weeks[this.activePageIndex][6]);            

            this.setState({
                weeks,
                msSelectedDate: nextProps.currentDate.valueOf(),
                monthName
            }, () => {
                if (msSelectedWeekStartDate > weeks[this.activePageIndex][0].valueOf()) {
                    console.log("next");                    
                    this.sliderRef.next();
                } else {
                    console.log("rev");
                    this.sliderRef.prev();            
                }
            })
        }
    }

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
                            return (
                                <div key={i}>
                                    <WeekDatesRow 
                                        week={week} 
                                        msSelectedDate={this.state.msSelectedDate}
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