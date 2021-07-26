import React, {Component} from 'react';
import {translate} from "react-i18next";
import moment from "moment";

import Radio from "../../../components/Radio/Radio";
import TextCheckBox from "../../../components/TextCheckBox/TextCheckBox";
import Calendar from "../../../components/Calendar/Calendar/Calendar";
import Modal from "../../../components/Modal/Modal";

import notesService from "../../../services/notes.service";

import {NoteRepeatType} from "../../../constants";

import './RepeatTypeSelectModal.scss';

class RepeatTypeSelectModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            repeatType: NoteRepeatType.NoRepeat,
            repeatValues: [],
            calendarPeriod: null
        };

        this.repeatTypeOptions = notesService.getRepeatTypeOptions();
        this.weekRepeatOptions = notesService.getWeekRepeatOptions();
    }

    setStateValuesFromProps() {
        this.setState({
            repeatType: this.props.repeatType,
            repeatValues: this.props.repeatValues
        });
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.setStateValuesFromProps();
    }

    onCalendarPeriodChange = (periodName) => {
        this.setState({
            calendarPeriod: {
                month: periodName.month,
                year: periodName.year
            }
        });
    }

    onDateSet = (date) => {
        this.setState({repeatValues: date});
    }

    render() {
        let {t} = this.props;

        return (
            <Modal
                className="repeat-type-select"
                isOpen={this.props.isOpen}
                onRequestClose={() => {this.setStateValuesFromProps(); this.props.onRequestClose();}}
                actionItems={[
                    {
                        text: t("cancel"),
                    },
                    {
                        text: t("ok"),
                        onClick: () => this.props.onSubmit({repeatType: this.state.repeatType, repeatValues: this.state.repeatValues})
                    }
                ]}
            >
                <div className="radio-group">
                    {
                        this.repeatTypeOptions.map((repeatTypeOption, i) => (
                            <div key={i}>
                                <Radio
                                    name="repeat-type"
                                    checked={this.state.repeatType === repeatTypeOption.val}
                                    value={repeatTypeOption.val}
                                    onChange={(e) => {
                                        let nextRepeatValues = [];
                                        if (e === NoteRepeatType.Any) {
                                            nextRepeatValues = [moment(this.props.defaultDate).startOf("day").valueOf()];
                                        }
                                        if (e === NoteRepeatType.Week) {
                                            nextRepeatValues = [moment(this.props.defaultDate).isoWeekday()];
                                        }
                                        this.setState({
                                            repeatType: e,
                                            repeatValues: nextRepeatValues
                                        })
                                    }}
                                    text={t(repeatTypeOption.translateId)}
                                />

                                {
                                    repeatTypeOption.val === NoteRepeatType.Week && this.state.repeatType === repeatTypeOption.val &&
                                    this.weekRepeatOptions.map((weekRepeatOption, i) => (
                                        <TextCheckBox
                                            key={i}
                                            id={weekRepeatOption.val}
                                            textValue={t(weekRepeatOption.translateId)}
                                            checkBoxValue={this.state.repeatValues.includes(weekRepeatOption.val)}
                                            onValueChange={(e) => {
                                                let nextRepeatValues = [];
                                                if (this.state.repeatValues.includes(e)) {
                                                    nextRepeatValues = this.state.repeatValues.filter((a) => a !== e);
                                                } else {
                                                    nextRepeatValues = [...this.state.repeatValues, e];
                                                }
                                                this.setState({
                                                    repeatValues: nextRepeatValues
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
                    this.state.repeatType === NoteRepeatType.Any &&
                    <div className="calendar-wrapper">
                        {
                            this.state.calendarPeriod &&
                            <div className="calendar-period theme-header-background">{this.state.calendarPeriod.month} {this.state.calendarPeriod.year}</div>
                        }

                        <Calendar
                            mode="multiselect"
                            currentDate={this.props.defaultDate}
                            msSelectedDates={this.state.repeatValues}
                            calendarNotesCounterMode={this.props.calendarNotesCounterMode}
                            onDatesSet={this.onDateSet}
                            onPeriodChange={this.onCalendarPeriodChange}
                        />
                    </div>
                }
            </Modal>
        )
    }
}

export default translate("translations")(RepeatTypeSelectModal);