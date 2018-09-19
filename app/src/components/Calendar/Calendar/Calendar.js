import React, {Component} from 'react';
import ReactSwipe from 'react-swipe';
import moment from 'moment';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import * as AppActions from '../../../actions'; 

import './Calendar.scss';

import MonthDates from "./MonthDates";
import WeekDays from "./WeekDays";

import sliderChangeSide from "../../../utils/sliderChangeSide";

import calendarService from "../../../services/calendar.service";

class Calendar extends Component {
    constructor(props) {
        super(props);

        let msSelectedDate = moment(this.props.currentDate).startOf("day").valueOf();
        let currentMonthStartDate = moment(msSelectedDate).startOf("month");  

        this.state = {
            monthes: this.getMonthes(currentMonthStartDate),
            currentMonthStartDate,
            msSelectedDate,
            msSelectedDates: (this.props.msSelectedDates && this.props.msSelectedDates.length) ? this.props.msSelectedDates : [msSelectedDate],
            mode: this.props.mode || "default"
        }

        this.activePageIndex = 1;  
        this.prevPageIndex = 1;

        this.noSlideEventHandle = false;
    }

    async componentDidMount() {
        document.querySelector(".notes-list-swiper").addEventListener("click", this.props.onCloseRequest);

        if (this.props.calendarNotesCounter && calendarService.checkForCountUpdate(this.state.msSelectedDate, this.props.calendar.intervalStartDate, this.props.calendar.intervalEndDate)) {
            this.props.getCount(this.state.msSelectedDate, "month");
        }
    }   

    componentWillUnmount() {
        document.querySelector(".notes-list-swiper").removeEventListener("click", this.props.onCloseRequest);
    }

    onSlideChange = async ({index, nextIndex, side}) => {   
        let currentMonthStartDate = side === "left" ? moment(this.state.currentMonthStartDate).subtract(1, 'month') : moment(this.state.currentMonthStartDate).add(1, 'month');
        let nextMonthStartDate = side === "left" ? moment(currentMonthStartDate).subtract(1, 'month') : moment(currentMonthStartDate).add(1, 'month');
        let monthes = [...this.state.monthes.slice(0, nextIndex), this.getMonthDays(nextMonthStartDate), ...this.state.monthes.slice(nextIndex + 1)];        

        if (this.props.calendarNotesCounter && calendarService.checkForCountUpdate(currentMonthStartDate.valueOf(), this.props.calendar.intervalStartDate, this.props.calendar.intervalEndDate)) {
            this.props.getCount(currentMonthStartDate.valueOf(), this.props.calendar.intervalStartDate, this.props.calendar.intervalEndDate, "month");
        } 

        this.setState({
            monthes: monthes,
            currentMonthStartDate
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
        let monthStartDateWeekDay = monthStartDate.weekday();
        let monthEndDateWeekDay = monthEndDate.weekday() + 1;

        let monthData = [];
        let weekData = [];
        
        for (let i = 0; i < monthStartDateWeekDay; i++) {
            weekData.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            let date = moment(monthStartDate).date(i);
            if (date.weekday() === 0) {
                monthData.push(weekData);
                weekData = [];
            }
            weekData.push(date);
        }

        for (let i = monthEndDateWeekDay; i <= 6; i++) {
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

            if (this.props.calendarNotesCounter && calendarService.checkForCountUpdate(nextDate.valueOf(), this.props.calendar.intervalStartDate, this.props.calendar.intervalEndDate)) {
                this.props.getCount(nextDate.valueOf(), this.props.calendar.intervalStartDate, this.props.calendar.intervalEndDate, "month");
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
                                        count={this.props.calendar.count}
                                        repeatable={this.props.calendar.repeatable}
                                        mode={this.state.mode}
                                        calendarNotesCounter={this.props.calendarNotesCounter}
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

function mapStateToProps(state) {
    return {
        calendar: state.calendar.month
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Calendar);