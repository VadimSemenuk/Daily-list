import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import moment from 'moment';
import {Link, withRouter} from 'react-router-dom';

import * as AppActions from '../../actions'; 

import './Header.scss';

import AddImg from "../../assets/img/add.svg";
import CalendarImg from "../../assets/img/calendar.svg";
import LeftArrowImg from "../../assets/img/left-arrow.svg";
import CheckedImg from "../../assets/img/checked.svg";
import SettimgsImg from "../../assets/img/settings.svg";

function getDayNameFormatted (date) {
    let day = date.locale("ru").format('dddd');
    return day[0].toUpperCase() + day.slice(1);
}
function getMonthFormatted (date) {
    return date.locale("ru").format('D MMMM');
}

let buttons = {
    "notes": [4, 0, 1],
    "add": [2, 3],  
    "password": [],
    default: [2],                       
}

let Header = (props) => (
    <header style={{backgroundColor: props.settings.theme.header}}>
        {
            props.showCurrentDate ?
            <div 
                onClick={props.onSelectToday}
                className="current-date"
            >
                <span className="day">{getDayNameFormatted(moment())}</span>
                <span className="date">{getMonthFormatted(moment())}</span> 
            </div> 
            :
            <div className="page-title">{props.title}</div>
        }
        <div className="buttons">
            {   
                (
                    buttons[props.page] ? buttons[props.page] : buttons.default
                ).map((a, i) => {
                    switch(a) {
                    case 0:
                        return (
                            <button 
                                key={a}
                                onClick={props.onCalendarRequest}
                            >
                                <img 
                                    src={CalendarImg}
                                    alt="date"    
                                />
                            </button>
                        )
                    case 1: 
                        return (
                            <Link
                                key={a}                                
                                className="button" 
                                to={`/add`}
                            >
                                <img 
                                    src={AddImg}
                                    alt="date"    
                                />
                            </Link>                    
                        )
                    case 2:        
                        return (                                       
                            <button
                                key={a}                                
                                className="button" 
                                onClick={props.history.goBack}
                            >
                                <img 
                                    src={LeftArrowImg}
                                    alt="date"    
                                />
                            </button>
                        )
                    case 3:
                        return (
                            <button 
                                key={a}
                                onClick={props.onSubmit}
                            >
                                <img 
                                    src={CheckedImg}
                                    alt="date"    
                                />
                            </button>    
                        )
                    case 4:         
                        return (  
                            <Link
                                key={a}                                
                                className="button" 
                                to={`/settings`}
                            >
                                <img 
                                    src={SettimgsImg}
                                    alt="date"    
                                />
                            </Link>
                        )
                    default: return null
                    }
                })
            }
        </div> 
    </header>
)

function mapStateToProps(state, props) {
    return {
        settings: state.settings
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Header));