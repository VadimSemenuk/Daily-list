import React, {Component} from 'react';
import ReactSwipe from 'react-swipe';
import moment from 'moment';

import './Calendar.scss';

import MonthDates from "./MonthDates";
import WeekDays from "./WeekDays";

import sliderChangeSide from "../../../utils/sliderChangeSide";

export default class Calendar extends Component {
    constructor(props) {
        super(props);

        let msSelectedDate = moment(this.props.currentDate).startOf("day").valueOf();
        let currentMonthStartDate = moment(msSelectedDate).startOf("month");        

        this.state = {
            monthes: this.getMonthes(currentMonthStartDate),
            currentMonthStartDate,
            msSelectedDate
        }

        this.activePageIndex = 1;  
        this.prevPageIndex = 1;

        this.noSlideEventHandle = false;
    }

    componentDidMount() {
        document.querySelector(".notes-list-swiper").addEventListener("click", this.props.onCloseRequest)
    }   

    componentWillUnmount() {
        document.querySelector(".notes-list-swiper").removeEventListener("click", this.props.onCloseRequest)
    }

    onSlideChange = ({index, nextIndex, side}) => {   
        let nextMonthes = this.state.monthes.slice();
        let nextCurrentMonthStartDate;
        
        if (side === "left") {
            nextCurrentMonthStartDate = moment(this.state.currentMonthStartDate).subtract(1, 'month');
            nextMonthes[nextIndex] = this.getMonthDays(moment(nextCurrentMonthStartDate).subtract(1, 'month'));   
        } else {   
            nextCurrentMonthStartDate = moment(this.state.currentMonthStartDate).add(1, 'month');
            nextMonthes[nextIndex] = this.getMonthDays(moment(nextCurrentMonthStartDate).add(1, 'month'));  
        }

        this.setState({
            monthes: nextMonthes,
            currentMonthStartDate: nextCurrentMonthStartDate
        })
    }

    getMonthes = (startMonthDate) => {
        return [
            this.getMonthDays(moment(startMonthDate).subtract(1, 'month')),
            this.getMonthDays(moment(startMonthDate)),
            this.getMonthDays(moment(startMonthDate).add(1, "month"))
        ]
    }

    getMonthDays = (monthStartDate) => {
        let monthEndDate = moment(monthStartDate).endOf('month');              
        let daysInMonth = monthStartDate.daysInMonth();               
        let monthStartDateWeekDay = monthStartDate.isoWeekday();
        let monthEndDateWeekDay = monthEndDate.isoWeekday() + 1;        

        let monthData = [];
        let weekData = [];
        
        for (let i = 1; i < monthStartDateWeekDay; i++) {
            weekData.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            let date = moment(monthStartDate).date(i);
            if (date.isoWeekday() === 1) {
                monthData.push(weekData);
                weekData = [];
            }
            weekData.push(date);
        }

        for (let i = monthEndDateWeekDay; i <= 7; i++) {
            weekData.push(null);
        }

        monthData.push(weekData);

        return monthData;
    }

    onDateSet = (date) => {
        this.setState({
            msSelectedDate: date.valueOf()
        })
        this.props.onDateSet(moment(date))
    }
    
    onSliderChange = (e) => {
        let action = sliderChangeSide(e, this.activePageIndex, this.prevPageIndex);
        this.prevPageIndex = action.prevPageIndex;
        this.activePageIndex = action.activePageIndex;

        if (this.noSlideEventHandle) {
            this.noSlideEventHandle = false
            return
        }
        this.onSlideChange(action);
    }

    componentWillReceiveProps(nextProps) {        
        let msSelectedDate = moment(nextProps.currentDate).startOf("day").valueOf();
        let currentMonthStartDate = moment(msSelectedDate).startOf("month");       

        if (currentMonthStartDate.valueOf() === this.state.currentMonthStartDate.valueOf()) {
            this.setState({
                msSelectedDate
            });
        } else {
            let monthes;

            let prevMonthStartDate = moment(currentMonthStartDate).subtract(1, 'week');
            let nextMonthStartDate = moment(currentMonthStartDate).add(1, 'week');

            if (currentMonthStartDate.valueOf() > this.state.currentMonthStartDate.valueOf()) {
                if (this.activePageIndex === 2) {
                    monthes = [this.getMonthDays(currentMonthStartDate), this.getMonthDays(nextMonthStartDate), this.getMonthDays(prevMonthStartDate)];
                } else if (this.activePageIndex === 0) {
                    monthes = [this.getMonthDays(prevMonthStartDate), this.getMonthDays(currentMonthStartDate), this.getMonthDays(nextMonthStartDate)];
                } else {
                    monthes = [this.getMonthDays(nextMonthStartDate), this.getMonthDays(prevMonthStartDate), this.getMonthDays(currentMonthStartDate)];
                }  

                this.noSlideEventHandle = true;
                this.sliderRef.next();
            } else {
                if (this.activePageIndex === 2) {
                    monthes = [this.getMonthDays(prevMonthStartDate), this.getMonthDays(currentMonthStartDate), this.getMonthDays(nextMonthStartDate)];
                } else if (this.activePageIndex === 0) {
                    monthes = [this.getMonthDays(nextMonthStartDate), this.getMonthDays(prevMonthStartDate), this.getMonthDays(currentMonthStartDate)];
                } else {
                    monthes = [this.getMonthDays(currentMonthStartDate), this.getMonthDays(nextMonthStartDate), this.getMonthDays(prevMonthStartDate)];
                }  

                this.noSlideEventHandle = true;
                this.sliderRef.prev();            
            }        

            this.setState({
                monthes,
                currentMonthStartDate,
                msSelectedDate
            })
        }
    }

    setSliderRef = (a) => {
        this.sliderRef = a;
    }

    render() {
        return (
            <div  
                className="calendar-wrapper"
                style={{background: this.props.settings.theme.header, borderColor: this.props.settings.theme.header}}
            >
                <div className="calendar-month-name">{this.state.currentMonthStartDate.locale("ru").format("MMMM")}</div>
                <WeekDays />
                <ReactSwipe
                    ref={this.setSliderRef}
                    className="calendar-swiper"
                    swipeOptions={{
                        continuous: true,
                        startSlide: 1,
                        callback: this.onSliderChange
                    }} 
                    key={3}
                >
                    {
                        this.state.monthes.map((monthWeeks, i) => {
                            return (
                                <div
                                    key={i}
                                    className={`calendar-month${i === this.activePageIndex ? " active" : ""}`}
                                >
                                    <MonthDates
                                        monthWeeks={monthWeeks}
                                        msSelectedDate={this.state.msSelectedDate}
                                        onSelect={this.onDateSet}
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