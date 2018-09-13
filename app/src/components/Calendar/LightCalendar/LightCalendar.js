import React, {Component} from 'react';
import ReactSwipe from 'react-swipe';
import moment from 'moment';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import * as AppActions from '../../../actions'; 

import './LightCalendar.scss';

import WeekDays from "./WeekDays";
import WeekDatesRow from "./WeekDatesRow";

import sliderChangeSide from "../../../utils/sliderChangeSide";

class LightCalendar extends Component {
    constructor(props) {
        super(props);

        let msSelectedDate = moment(this.props.currentDate).startOf("day").valueOf();
        let weeks = this.generateWeeksSequence(moment(msSelectedDate).startOf('week'));

        this.state = {
            weeks,
            msSelectedDate,
            monthName: this.getMonthName(weeks[1][0], weeks[1][6])
        }

        this.activePageIndex = 1;  
        this.prevPageIndex = 1;

        this.noSlideEventHandle = false;
    }

    async componentDidMount() {
        if (this.props.calendarNotesCounter) {
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

        if (this.props.calendarNotesCounter) {
            this.props.updateCount(false, weeks[nextIndex][0], this.props.calendar.intervalStartDate, this.props.calendar.intervalEndDate, "week");
        }

        let monthName = this.getMonthName(weeks[index][0], weeks[index][6]);
        
        this.setState({
            weeks,
            monthName
        })
    }

    getMonthName(startWeekDate, endWeekDate) {
        const weekStartDayMonthName = startWeekDate.format('MMMM');   
        const weekEndDayMonthName = endWeekDate.format('MMMM');
        
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

    async componentWillReceiveProps(nextProps) {
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

            if (msSelectedWeekStartDate > this.state.weeks[this.activePageIndex][0].valueOf()) {
                if (this.activePageIndex === 2) {
                    weeks = [this.generateWeekDates(currentWeekStartDate), this.generateWeekDates(nextWeekStartDate), this.generateWeekDates(prevWeekStartDate)];
                } else if (this.activePageIndex === 0) {
                    weeks = [this.generateWeekDates(prevWeekStartDate), this.generateWeekDates(currentWeekStartDate), this.generateWeekDates(nextWeekStartDate)];
                } else {
                    weeks = [this.generateWeekDates(nextWeekStartDate), this.generateWeekDates(prevWeekStartDate), this.generateWeekDates(currentWeekStartDate)];
                }
                this.noSlideEventHandle = true;
                this.sliderRef.next();
                nextDate = nextWeekStartDate;
            } else {
                if (this.activePageIndex === 2) {
                    weeks = [this.generateWeekDates(prevWeekStartDate), this.generateWeekDates(currentWeekStartDate), this.generateWeekDates(nextWeekStartDate)];
                } else if (this.activePageIndex === 0) {
                    weeks = [this.generateWeekDates(nextWeekStartDate), this.generateWeekDates(prevWeekStartDate), this.generateWeekDates(currentWeekStartDate)];
                } else {
                    weeks = [this.generateWeekDates(currentWeekStartDate), this.generateWeekDates(nextWeekStartDate), this.generateWeekDates(prevWeekStartDate)];
                }
                this.noSlideEventHandle = true;
                this.sliderRef.prev();
                nextDate = prevWeekStartDate;
            }

            if (this.props.calendarNotesCounter) {
                this.props.updateCount(false, nextDate.valueOf(), this.props.calendar.intervalStartDate, this.props.calendar.intervalEndDate, "week");
            }

            let monthName = this.getMonthName(weeks[this.activePageIndex][0], weeks[this.activePageIndex][6]);            

            this.setState({
                weeks,
                msSelectedDate: nextProps.currentDate.valueOf(),
                monthName
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

        if (this.noSlideEventHandle) {
            this.noSlideEventHandle = false
            return
        }
        this.onSlideChange(action);
    }

    render() {
        return (
            <div className="light-calendar-wrapper theme-header-background theme-header-border">
                <div className="light-calendar-month">{this.state.monthName}</div>
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
        calendar: state.calendar.week
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LightCalendar);