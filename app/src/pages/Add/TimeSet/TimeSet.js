import React, {Component} from 'react';
import moment from 'moment';
import {translate, Trans} from "react-i18next";

import {SwitchListItem, ListItem} from "../../../components/ListItem/ListItem";

import RemoveImg from '../../../assets/img/remove.png';

import './TimeSet.scss';

class TimeSet extends Component {
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
        if (!this.props.startTime) {
            window.plugins.toast.showLongBottom(this.props.t("set-time-first"));                   
        }
        
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
        let {t} = this.props;
        
        return (
            <div className="set-time-wrapper">
                <ListItem 
                    className="tiny no-touchable"
                    text={t("theme")}
                    ValElement={() => (
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
                                            src={RemoveImg} 
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
                                            src={RemoveImg} 
                                            alt="rm"
                                        />        
                                    </button>
                                }
                            </div>
                        </div>      
                    )}
                />

                <SwitchListItem 
                    className="tiny"
                    text={t("notify")}  
                    checked={this.props.notificate}
                    onChange={this.onNotificateChange} 
                    disabled={!this.props.startTime}  
                />
            </div>
        )
    }
}

export default translate("translations")(TimeSet)