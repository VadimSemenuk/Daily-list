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
import ExportImg from '../../assets/img/upload-to-cloud.svg';

let buttons = {
    "notes": [5, 4, 0, 1],
    "add": [2, 3],  
    "password": [],
    default: [2],                       
};

let Header = (props) => (
    <header className="theme-header-background">
        <div>
            {
                props.page === "notes" &&
                <div 
                    onClick={props.onSelectToday}
                    className="current-date clickable"
                >
                    <span className="day">{moment().format('dddd')}</span>
                    <span className="date">{moment().format('D MMMM')}</span> 
                </div>
            }
            {
                props.title && <div className="page-title">{props.title}</div>
            }
            {
                props.page === "add" && 
                <div 
                    className="date-pick-view-wrapper" 
                    onClick={props.onCalendarRequest}
                >
                    <button>
                        <img 
                            src={CalendarImg}
                            alt="date"    
                        />
                    </button>
                    <div className="current-date clickable">
                        <span className="day">{props.currentDate.format('dddd')}</span>
                        <span className="date">{props.currentDate.format('D MMMM')}</span> 
                    </div>
                </div>
            }
        </div>
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
                        );
                    case 1: 
                        if (props.settings.notesShowInterval === 0) {
                            return null
                        } 
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
                        );
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
                        );
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
                        );
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
                        );
                    case 5: 
                        return ( 
                            props.user &&
                            <button 
                                key={a}
                                onClick={props.uploadBackup}
                            >
                                <img 
                                    src={ExportImg}
                                    alt="backup"    
                                />
                            </button>
                        );
                    default: return null
                    }
                })
            }
        </div> 
    </header>
);

function mapStateToProps(state) {
    return {      
        settings: state.settings,
        user: state.user
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Header));