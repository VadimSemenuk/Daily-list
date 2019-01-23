import React, {Component} from 'react';
import moment from 'moment';
import {translate} from "react-i18next";

import {SwitchListItem, ListItem, ModalListItem, ValueListItem} from "../../../components/ListItem/ListItem";
import Radio from '../../../components/Radio/Radio';
import Calendar from '../../../components/Calendar/Calendar/Calendar';

import notesService from '../../../services/notes.service';

import RemoveImg from '../../../assets/img/remove.png';

import './TimeSet.scss';
import TextCheckBox from "../../../components/TextCheckBox/TextCheckBox";

class TimeSet extends Component {
    constructor(props) {
        super(props);

        this.state = {
            repeatTypeSelected: this.props.repeatType,
            repeatDatesSelected: this.props.repeatDates
        };

        this.removeNotificationFromDefault = false;
    }

    onTimeSet = (date, state) => {     
        let notificate;
        if (
            this.props.settings.defaultNotification && 
            !this.removeNotificationFromDefault && 
            !this.props.notificate && 
            state === "startTime"
        ) {
            notificate = true
        } else {
            notificate = this.props.notificate;
        }

        this.props.onStateChange({
            notificate,
            [state]: moment(date)                 
        })
    };

    pickTime = (state) => {
        let date = this.props[state] || moment();

        window.DateTimePicker.pick({
            type: 'time',         
            date: new Date(date.valueOf())
        }, (date) => this.onTimeSet(moment(date).startOf("minute").valueOf(), state));
    };

    onNotificateChange = (notificate) => {
        if (!this.props.startTime) {
            window.plugins.toast.showLongBottom(this.props.t("set-time-first"));           
            return        
        }
        
        if (this.props.settings.defaultNotification && !notificate) {
            this.removeNotificationFromDefault = true;
        }

        this.props.onStateChange({
            notificate                   
        })
    };

    reset = (field) => {
        let notificate = this.props.notificate;

        if (field === "startTime") {
            notificate = false;
        }

        this.props.onStateChange({
            [field]: false,
            notificate                
        })
    };

    onRepeatSet = (e) => {
        this.props.onStateChange({
            repeatType: e             
        })
    };

    onRepeatDateSelect = (e) => {
        this.props.onStateChange({
            repeatType: e             
        })
    };

    render() {  
        let {t} = this.props;
        let repeatTypeOptions = notesService.getRepeatTypeOptions();
        let selectedRepeatTypeOption = repeatTypeOptions.find((a) => a.val === this.props.repeatType);
        let weekRepeatOptions = notesService.getWeekRepeatOptions();

        return (
            <div className="set-time-wrapper">
                <ListItem 
                    className="tiny no-touchable no-padding"
                    text={t("time")}
                    ValElement={() => (
                        <div className="set-time-actions-wrapper">
                            <div className="set-time-action-wrapper">
                                <button
                                    className="pick"
                                    onClick={() => this.pickTime('startTime')}
                                >
                                    <span>{this.props.startTime ? this.props.startTime.format('HH:mm') : t('specify-btn')}</span>     
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
                                    <span>{this.props.endTime ? this.props.endTime.format('HH:mm') : t('specify-btn')}</span>   
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

                <ModalListItem
                    className="tiny"
                    text={t("repeat-type")} 
                    value={t(selectedRepeatTypeOption.translateId)}
                    listItem={ValueListItem}
                    actionItems={[
                        {
                            text: t("cancel"),
                            onClick: () => this.setState({repeatTypeSelected: selectedRepeatTypeOption.val})
                        },
                        {
                            text: t("ok"),
                            onClick: () => this.props.onStateChange({
                                repeatType: this.state.repeatTypeSelected,
                                repeatDates: this.state.repeatDatesSelected
                            })
                        }
                    ]}
                >
                    <div className="radio-group">
                        {
                            repeatTypeOptions.map((setting, i) => (
                                <div key={i}>
                                    <Radio
                                        name="repeat-type"
                                        checked={this.state.repeatTypeSelected === setting.val}
                                        value={setting.val}
                                        onChange={(e) => {
                                            let nextRepeatDates = [];
                                            if (e === "any") {
                                                nextRepeatDates = [moment(this.props.date).startOf("day").valueOf()];
                                            }
                                            if (e === "week") {
                                                nextRepeatDates = [moment(this.props.date).isoWeekday()];
                                            }
                                            this.setState({
                                                repeatTypeSelected: e,
                                                repeatDatesSelected: nextRepeatDates
                                            })
                                        }}
                                        text={t(setting.translateId)}
                                    />

                                    {
                                        setting.val === "week" && this.state.repeatTypeSelected === setting.val &&
                                        weekRepeatOptions.map((option, i) => (
                                            <TextCheckBox
                                                key={i}
                                                id={option.val}
                                                textValue={t(option.translateId)}
                                                checkBoxValue={this.state.repeatDatesSelected.includes(option.val)}
                                                onValueChange={(e) => {
                                                    let nextRepeatDates = [];
                                                    if (this.state.repeatDatesSelected.includes(e)) {
                                                        nextRepeatDates = this.state.repeatDatesSelected.filter((a) => a !== e);
                                                    } else {
                                                        nextRepeatDates = [...this.state.repeatDatesSelected, e];
                                                    }
                                                    this.setState({
                                                        repeatDatesSelected: nextRepeatDates
                                                    });
                                                }}
                                                cross={false}
                                            />
                                        ))
                                    }
                                </div>
                            ))
                        }
                    </div>

                    {
                        this.state.repeatTypeSelected === "any" &&
                        <Calendar 
                            mode="multiselect"
                            currentDate={this.props.currentDate}
                            msSelectedDates={this.state.repeatDatesSelected}
                            calendarNotesCounter={this.props.settings.calendarNotesCounter}                            
                            onDatesSet={(e) => this.setState({ repeatDatesSelected: e })}
                        />
                    }
                </ModalListItem>
            </div>
        )
    }
}

export default translate("translations")(TimeSet)