import React, {Component} from 'react';
import moment from 'moment';

import Switch from "../../Elements/Switch/Switch"

import './TimeSet.scss';

export default class Add extends Component {
    constructor(props) {
        super(props);

        this.removeNotificationFromDefault = false;
    }

    onTimeSet = (date, state) => {     
        let notificate;
        if (date < moment().startOf("minute").valueOf()) {
            notificate = false;
        } else if (this.props.settings.defaultNotification && !this.removeNotificationFromDefault && !this.props.notificate && state === "startTime") {
            notificate = true
        } else {
            notificate = this.props.notificate;
        }

        this.props.onStateChange({
            notificate,
            [state]: moment(date)                 
        })
    }

    pickTime = (state) => {
        let date = this.props[state] || moment();

        window.DateTimePicker.pick({
            type: 'time',         
            date: new Date(date.valueOf())
        }, (date) => this.onTimeSet(moment(date).startOf("minute").valueOf(), state));
    }

    onNotificateChange = (notificate) => { 
        if (this.props.settings.defaultNotification && !notificate) {
            this.removeNotificationFromDefault = true;
        }

        this.props.onStateChange({
            notificate                   
        })
    }

    reset = (field) => {
        let notificate = this.props.notificate

        if (field === "startTime") {
            notificate = false;
        }

        this.props.onStateChange({
            [field]: false,
            notificate                
        })
    }

    render() {   
        return (
            <div className="set-time-wrapper">
                <div className="set-time-container">
                    <span>Время:</span>
                    <div className="set-time-actions-wrapper">
                        <div className="set-time-action-wrapper">
                            <button
                                className="pick"
                                onClick={() => this.pickTime('startTime')}
                            >
                                <span>{this.props.startTime ? this.props.startTime.format('HH:mm') : 'Указать'}</span>     
                            </button>
                            {
                                this.props.startTime &&
                                <button 
                                    className="set-time-reset"
                                    onClick={() => this.reset("startTime")}
                                >
                                    <img
                                        src={require('../../../media/img/remove.png')} 
                                        alt="rm"
                                    />        
                                </button>
                            }
                        </div>
                        <span className="divider">-</span>
                        <div className="set-time-action-wrapper">
                            <button 
                                className="pick"
                                onClick={() => this.pickTime('endTime')}
                            >
                                <span>{this.props.endTime ? this.props.endTime.format('HH:mm') : 'Указать'}</span>   
                            </button>
                            {
                                this.props.endTime &&
                                <button 
                                    className="set-time-reset"
                                    onClick={() => this.reset("endTime")}
                                >
                                    <img
                                        src={require('../../../media/img/remove.png')} 
                                        alt="rm"
                                    />        
                                </button>
                            }
                        </div>
                    </div>
                </div>

                <div className="set-notificate-container">
                    <span>Напомнить:</span>

                    <Switch 
                        onChange={this.onNotificateChange}
                        checked={this.props.notificate}
                        disabled={!this.props.startTime}
                    />
                </div>
            </div>
        )
    }
}