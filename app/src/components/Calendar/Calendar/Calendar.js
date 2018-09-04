import React, {Component} from 'react';
import ReactSwipe from 'react-swipe';
import moment from 'moment';

import './Calendar.scss';

import MonthDates from "./MonthDates";
import WeekDays from "./WeekDays";

import sliderChangeSide from "../../../utils/sliderChangeSide";

import { monthCalendarService as calendarService } from "../../../services/calendar.service";

export default class Calendar extends Component {
    constructor(props) {
        super(props);

        let msSelectedDate = moment(this.props.currentDate).startOf("day").valueOf();
        let currentMonthStartDate = moment(msSelectedDate).startOf("month");        

        this.state = {
            monthes: this.getMonthes(currentMonthStartDate),
            currentMonthStartDate,
            msSelectedDate,
            msSelectedDates: (this.props.msSelectedDates && this.props.msSelectedDates.length) ? this.props.msSelectedDates : [msSelectedDate],
            mode: this.props.mode || "default",
            count: {}
        }

        this.activePageIndex = 1;  
        this.prevPageIndex = 1;

        this.noSlideEventHandle = false;
    }

    async componentDidMount() {
        document.querySelector(".notes-list-swiper").addEventListener("click", this.props.onCloseRequest)

        calendarService.setNotesCountInterval(4);
        let count = await calendarService.getNotesCount(this.state.msSelectedDate);
        this.setState({
            count
        })
    }   

    componentWillUnmount() {
        document.querySelector(".notes-list-swiper").removeEventListener("click", this.props.onCloseRequest)
    }

    onSlideChange = async ({index, nextIndex, side}) => {   
        let nextMonthes = this.state.monthes.slice();
        let nextCurrentMonthStartDate;
        
        if (side === "left") {
            nextCurrentMonthStartDate = moment(this.state.currentMonthStartDate).subtract(1, 'month');
            nextMonthes[nextIndex] = this.getMonthDays(moment(nextCurrentMonthStartDate).subtract(1, 'month'));   
        } else {   
            nextCurrentMonthStartDate = moment(this.state.currentMonthStartDate).add(1, 'month');
            nextMonthes[nextIndex] = this.getMonthDays(moment(nextCurrentMonthStartDate).add(1, 'month'));  
        }

        let count = (await calendarService.updateNotesCountData(nextCurrentMonthStartDate.valueOf())) || this.state.count;        

        this.setState({
            monthes: nextMonthes,
            currentMonthStartDate: nextCurrentMonthStartDate,
            count
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

    onDateSet = (date, active) => {
        if (this.props.mode === "multiselect") {
            let msSelectedDates;
            let msDate = date.valueOf()

            if (active) {
                let index = this.state.msSelectedDates.findIndex((a) => a === msDate);
                msSelectedDates = [...this.state.msSelectedDates.slice(0, index), ...this.state.msSelectedDates.slice(index + 1)];
            } else {
                msSelectedDates = [...this.state.msSelectedDates, msDate];
            }

            this.setState({
                msSelectedDates
            })

            this.props.onDatesSet(msSelectedDates);
        } else {
            if (!active) {
                this.setState({
                    msSelectedDate: date.valueOf()
                })
                this.props.onDateSet(moment(date))
            }
        }
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

    async componentWillReceiveProps(nextProps) {        
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
            
            let nextDate;

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
                nextDate = nextMonthStartDate;
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
                nextDate = prevMonthStartDate;
            }        

            let count = (await calendarService.updateNotesCountData(nextDate.valueOf())) || this.state.count;

            this.setState({
                monthes,
                currentMonthStartDate,
                msSelectedDate,
                count
            })
        }
    }

    setSliderRef = (a) => {
        this.sliderRef = a;
    }

    render() {
        return (
            <div className="calendar-wrapper theme-header-background theme-header-border">
                <div className="calendar-month-name">{this.state.currentMonthStartDate.format("MMMM")}</div>
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
                                        msSelectedDates={this.state.msSelectedDates}
                                        onSelect={this.onDateSet}
                                        count={this.state.count}
                                        mode={this.state.mode}
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