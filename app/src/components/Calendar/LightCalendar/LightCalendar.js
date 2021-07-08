import React, {Component} from 'react';
import ReactSwipe from 'react-swipe';
import moment from 'moment';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import * as AppActions from '../../../actions'; 

import './LightCalendar.scss';

import WeekDays from "../Common/WeekDays/WeekDays";
import WeekDatesRow from "./WeekDatesRow";

import getSliderChangeSide from "../../../utils/sliderChangeSide";

import calendarService from "../../../services/calendar.service";

class LightCalendar extends Component {
    constructor(props) {
        super(props);

        let msSelectedDate = moment(this.props.currentDate).startOf("day").valueOf();
        let weeks = this.generateWeeksSequence(moment(msSelectedDate).startOf('week'));

        this.state = {
            weeks,
            msSelectedDate,
            currentPeriodName: this.getPeriodName(weeks[1][0], weeks[1][6])
        }

        this.activePageIndex = 1;  
        this.prevPageIndex = 1;

        this.noSlideEventHandle = false;

        this.dispatchedActionName = null;

        this.props.onPeriodChange(this.state.currentPeriodName);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.currentPeriodName != prevState.currentPeriodName) {
            this.props.onPeriodChange(this.state.currentPeriodName);
        }
    }

    async componentDidMount() {
        if (calendarService.checkForCountUpdate(this.state.msSelectedDate, this.props.calendar.intervalStartDate, this.props.calendar.intervalEndDate)) {
            this.props.getCount(this.state.msSelectedDate, "week");
        }
    }

    generateWeekDates(weekStartDate) {
        let weekDates = [weekStartDate];
        for (let a = 1; a < 7; a++) {
            weekDates.push(moment(weekStartDate).weekday(a));
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

    onSlideChange = async ({index, nextIndex, side}) => {   
        let nextDate = side === "left" ? moment(this.state.weeks[index][0]).subtract(1, 'week') : moment(this.state.weeks[index][0]).add(1, 'week');
        let weeks = [...this.state.weeks.slice(0, nextIndex), this.generateWeekDates(nextDate), ...this.state.weeks.slice(nextIndex + 1)];

        if (calendarService.checkForCountUpdate(weeks[nextIndex][0], this.props.calendar.intervalStartDate, this.props.calendar.intervalEndDate)) {
            this.dispatchedActionName = "GET_COUNT";
            this.props.getCount(weeks[nextIndex][0], "week");
        }

        let currentPeriodName = this.getPeriodName(weeks[index][0], weeks[index][6]);
        
        this.setState({
            weeks,
            currentPeriodName
        })
    }

    getPeriodName(periodStartDate, periodEndDate) {
        let periodStartMonthName = periodStartDate.format('MMMM');
        let periodEndMonthName = periodEndDate.format('MMMM');

        let periodStartYearName = periodStartDate.format('YYYY');
        let periodEndYearName = periodEndDate.format('YYYY');

        return {
            month: periodStartMonthName !== periodEndMonthName ? `${periodStartMonthName} - ${periodEndMonthName}` : periodEndMonthName,
            year: periodStartYearName !== periodEndYearName ? `${periodStartYearName} - ${periodEndYearName}` : periodEndYearName,
        }
    }

    setDate = (date) => {
        this.setState({
            msSelectedDate: date.valueOf()
        })

        this.props.onDateSet(moment(date));
    }

    async componentWillReceiveProps(nextProps, a) {
        if (this.dispatchedActionName) {
            if (this.dispatchedActionName === "GET_COUNT") {
                this.dispatchedActionName = null;
                return;
            }
        }

        let msSelectedWeekStartDate = moment(nextProps.currentDate).startOf('week').valueOf();

        if (msSelectedWeekStartDate === this.state.weeks[this.activePageIndex][0].valueOf()) {
            this.setState({
                msSelectedDate: nextProps.currentDate.valueOf()
            });
        } else {
            let weeks;

            let currentWeekStartDate = moment(msSelectedWeekStartDate);
            let prevWeekStartDate = moment(msSelectedWeekStartDate).subtract(1, 'week');
            let nextWeekStartDate = moment(msSelectedWeekStartDate).add(1, 'week');

            let nextDate;

            let currentWeekDays = this.generateWeekDates(currentWeekStartDate);
            let nextWeekDays = this.generateWeekDates(nextWeekStartDate);
            let prevWeekDays = this.generateWeekDates(prevWeekStartDate);

            if (msSelectedWeekStartDate > this.state.weeks[this.activePageIndex][0].valueOf()) {
                if (this.activePageIndex === 2) {
                    weeks = [currentWeekDays, nextWeekDays, prevWeekDays];
                } else if (this.activePageIndex === 0) {
                    weeks = [prevWeekDays, currentWeekDays, nextWeekDays];
                } else {
                    weeks = [nextWeekDays, prevWeekDays, currentWeekDays];
                }
                this.noSlideEventHandle = true;
                this.sliderRef.next();
                nextDate = nextWeekStartDate;
            } else {
                if (this.activePageIndex === 2) {
                    weeks = [prevWeekDays, currentWeekDays, nextWeekDays];
                } else if (this.activePageIndex === 0) {
                    weeks = [nextWeekDays, prevWeekDays, currentWeekDays];
                } else {
                    weeks = [currentWeekDays, nextWeekDays, prevWeekDays];
                }
                this.noSlideEventHandle = true;
                this.sliderRef.prev();
                nextDate = prevWeekStartDate;
            }

            if (calendarService.checkForCountUpdate(nextDate.valueOf(), this.props.calendar.intervalStartDate, this.props.calendar.intervalEndDate)) {
                this.props.getCount(nextDate.valueOf(), "week");
            }

            let currentPeriodName = this.getPeriodName(weeks[this.activePageIndex][0], weeks[this.activePageIndex][6]);

            this.setState({
                weeks,
                msSelectedDate: nextProps.currentDate.valueOf(),
                currentPeriodName
            })
        }
    }

    setSliderRef = (a) => {
        this.sliderRef = a;
    }

    onSliderChange = (e) => {
        const action = getSliderChangeSide(e, this.activePageIndex, this.prevPageIndex);
        this.prevPageIndex = action.prevPageIndex;
        this.activePageIndex = action.activePageIndex;

        if (this.noSlideEventHandle) {
            this.noSlideEventHandle = false
            return
        }
        this.onSlideChange(action);
    }

    render() {
        return (
            <div className="light-calendar-wrapper theme-header-background theme-header-border">
                <WeekDays />
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
                                        count={this.props.calendar.count}
                                        calendarNotesCounterMode={this.props.calendarNotesCounterMode}
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
        calendar: state.calendar.week
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LightCalendar);