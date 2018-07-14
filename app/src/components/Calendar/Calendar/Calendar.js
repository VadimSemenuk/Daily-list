import React, {Component} from 'react';
import ReactSwipe from 'react-swipe';
import moment from 'moment';

import './Calendar.scss';

export default class Calendar extends Component {
    constructor(props) {
        super(props);

        this.state={
            currentDate: moment(this.props.currentDate).startOf("day"),
            selectedDateMS: moment(this.props.currentDate).startOf("day").valueOf()
        }

        this.activePageIndex = 1;  
        this.prevPageIndex = 1;
    }

    onSlideChange = ({index, nextIndex, side}) => {       
        if (side === "left") {
            this.setState({ 
                currentDate: moment(this.state.currentDate).subtract(1, 'month')   
            })  
        } else {   
            this.setState({ 
                currentDate: moment(this.state.currentDate).add(1, 'month')   
            })
        }
    }

    getMonthDays = (date) => {
        let monthStartDate = moment(date).startOf('month');   
        let monthEndDate = moment(date).endOf('month');              
        let daysInMonth = moment(date).daysInMonth();               
        
        let monthData = [];
        let weekData = [];
        
        for (let i = 1; i < monthStartDate.isoWeekday(); i++) {
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

        for (let i = monthEndDate.isoWeekday() + 1; i <= 7; i++) {
            weekData.push(null);
        }

        monthData.push(weekData);

        return monthData;
    }

    getMonthesCount = (date) => {
        if (this.activePageIndex === 2) {
            return [
                moment(date).add(1, 'month'),
                moment(date).subtract(1, 'month'),
                moment(date)
            ];
        } else if (this.activePageIndex === 0) {
            return [
                moment(date),
                moment(date).add(1, "month"),
                moment(date).subtract(1, 'month')
            ];
        } else {
            return [
                moment(date).subtract(1, 'month'),
                moment(date),
                moment(date).add(1, "month")
            ];
        }
    }

    onDateSet = (date) => {
        this.setState({
            selectedDateMS: date.valueOf()
        })
        this.props.onDateSet(moment(date))
    }

    render() {
        return (
            <div  
                className="calendar-wrapper"
                style={{background: this.props.settings.theme.header, borderColor: this.props.settings.theme.header}}
            >
                <div className="calendar-month-name">{this.state.currentDate.locale("ru").format("MMMM")}</div>
                <div className="week-days">
                    <span>Пн</span>
                    <span>Вт</span>
                    <span>Ср</span>
                    <span>Чт</span>
                    <span>Пт</span>
                    <span>Сб</span>
                    <span>Вс</span>                    
                </div>
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
                        this.getMonthesCount(this.state.currentDate).map((a, i) => {
                            return (
                                <div
                                    key={i}
                                    className={`calendar-month${i === this.activePageIndex ? " active" : ""}`}
                                >
                                <div className="calendar-month-container">
                                    {
                                        this.getMonthDays(a).map((a, i) => {
                                            return (
                                                <div
                                                    key={i}
                                                    className="calendar-week"
                                                >
                                                    {
                                                        a.map((a, i) => {
                                                            if (!a) {
                                                                return <div key={i} className="calendar-date"></div>
                                                            }

                                                            let active = a.valueOf() === this.state.selectedDateMS;
                                                            return (
                                                                <button 
                                                                    className={`calendar-date ${active ? 'active' : ''}`}
                                                                    key={i} 
                                                                    onClick={() => this.onDateSet(a)}
                                                                >{a.format('DD')}</button> 
                                                            )
                                                        })
                                                    }
                                                </div>
                                            )
                                        })
                                    }  
                                </div> 
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