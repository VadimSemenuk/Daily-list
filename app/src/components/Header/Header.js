import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import moment from 'moment';
import {Link, withRouter} from 'react-router-dom';

import * as AppActions from '../../actions'; 

import './Header.scss';

function getDayNameFormatted (date) {
    let day = date.locale("ru").format('dddd');
    return day[0].toUpperCase() + day.slice(1);
}
function getMonthFormatted (date) {
    return date.locale("ru").format('D MMMM');
}

class Header extends Component {
    constructor(props) {
        super(props);

        this.state = {
            page: this.props.page
        }

        this.buttons = {
            "notes": [4, 0, 1],
            "add": [2, 3],  
            "password": [],
            default: [2],                       
        }
    }

    render() {
        return (
            <header style={{backgroundColor: this.props.settings.theme.header}}>
                {
                    this.props.showCurrentDate ?
                    <div 
                        onClick={this.selectToday}
                        className="current-date"
                    >
                        <span className="day">{getDayNameFormatted(moment())}</span>
                        <span className="date">{getMonthFormatted(moment())}</span> 
                    </div> 
                    :
                    <div/>
                }
                <div className="buttons">
                    {   
                        (
                            this.buttons[this.state.page] ? this.buttons[this.state.page] : this.buttons.default
                        ).map((a, i) => {
                            switch(a) {
                            case 0:
                                return (
                                    <button 
                                        key={a}
                                        onClick={this.props.onCalendarRequest}
                                    >
                                        <img 
                                            src={require("../../media/img/calendar.svg")}
                                            alt="date"    
                                        />
                                    </button>
                                )
                            case 1: 
                                return (
                                    <button
                                        key={a}                                
                                        onClick={this.props.onAddPageRequest}
                                    >
                                        <img 
                                            src={require("../../media/img/add.svg")}
                                            alt="date"    
                                        />
                                    </button>                      
                                )
                            case 2:        
                                return (                                       
                                    <button
                                        key={a}                                
                                        className="button" 
                                        onClick={this.props.history.goBack}
                                    >
                                        <img 
                                            src={require("../../media/img/left-arrow.svg")}
                                            alt="date"    
                                        />
                                    </button>
                                )
                            case 3:
                                return (
                                    <button 
                                        key={a}
                                        onClick={this.props.onSubmit}
                                    >
                                        <img 
                                            src={require("../../media/img/checked.svg")}
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
                                            src={require("../../media/img/settings.svg")}
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
        );
    }
}

function mapStateToProps(state, props) {
    return {
        settings: state.settings,
        router: state.router
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Header));