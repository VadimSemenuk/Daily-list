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
            route: "/"
        }

        this.buttons = {
            "/": [4, 0, 1],
            "/add": [2, 3],  
            "/password": [],
            "/edit": [2, 3],
            default: [2],                       
        }

        this.listenRouteChanges();
    }

    listenRouteChanges() {
        this.props.history.listen((location, action, c) => {                
            this.setState({
                route: location.pathname
            })
        });        
    }

    selectToday = () => {
        this.props.onDateSelect(moment().startOf("day"));
    }

    render() {
      return (
        <header style={{backgroundColor: this.props.settings.theme.header}}>
            <div 
                onClick={this.selectToday}
                className="current-date"
            >
                <span className="day">{getDayNameFormatted(moment())}</span>
                <span className="date">{getMonthFormatted(moment())}</span> 
            </div> 
            <div className="buttons">
                {   
                    (
                        this.buttons[this.state.route] ? this.buttons[this.state.route] : this.buttons.default
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
                                    onClick={() => {
                                        this.props.history.push({
                                            pathname: `/add`,
                                            state: { 
                                                dateIndex: this.props.getDateIndex()
                                            }
                                        })
                                    }}
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
                                    onClick={this.props.onAddRequest}
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