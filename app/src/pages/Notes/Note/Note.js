import React, {PureComponent} from 'react';
import {translate} from "react-i18next";

import TextCheckBox from '../../../components/TextCheckBox/TextCheckBox';
import CustomCheckBox from '../../../components/CustomCheckBox/CustomCheckBox';

import AlarmImg from '../../../assets/img/alarm.svg';
import MoreImg from "../../../assets/img/more.svg";
import RepeatImg from "../../../assets/img/two-circling-arrows.svg";

import './Note.scss';

class Note extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            expanded: false,
        };
    }

    onDynamicFieldChange = (i, v) => {
        if (this.props.context && (this.props.context === 'search' && this.props.context.params.searchRepeatType !== 'no-repeat')) {
            return;
        }

        let nextDynamicFields = [
            ...this.props.itemData.dynamicFields.slice(0, i),
            {
                ...this.props.itemData.dynamicFields[i],
                checked: v
            },
            ...this.props.itemData.dynamicFields.slice(i + 1)
        ];

        this.props.onDynamicFieldChange(this.props.itemData, {dynamicFields: nextDynamicFields});
    };

    onItemFinishChange = (v) => {
        this.props.onDynamicFieldChange(this.props.itemData, {finished: v});
    };

    onDialogRequest = (e) => {
        e.stopPropagation();

        this.props.onDialogRequest(this.props.itemData);
    }

    triggerExpanded = () => {
        this.setState({expanded: !this.state.expanded});
    };

    showImage = (e) => {
        e.stopPropagation();
        
        window.PhotoViewer.show(e.target.src, this.props.itemData.title, {share: false});         
    };

    render () {
        let {t} = this.props;
        
        return (
            <div
                data-id={this.props.itemData.key}
                className={`note-wrapper ${(this.state.expanded || !this.props.settings.minimizeNotes) && 'expanded'} ${!this.props.settings.minimizeNotes && 'force-expanded'} ${this.props.itemData.finished && 'finished'} ${!this.props.itemData.finished && 'not-finished'}`}
                onClick={this.triggerExpanded}
            >
                <div
                    style={{backgroundColor: this.props.itemData.tag}}
                    className="tag"
                ></div>
                <div className="note-content">
                    <div style={{fontSize: 12, color: '#ccc', position: 'absolute', top: 3, left: 3}}>{this.props.itemData.manualOrderIndex}</div>

                    <div className="note-header">
                        {this.props.itemData.startTime && <span className="note-header-time">{this.props.itemData.startTime.format('HH:mm')}</span>}
                        {this.props.itemData.endTime && <span className="note-header-time-divider">-</span>}
                        {this.props.itemData.endTime && <span className="note-header-time">{this.props.itemData.endTime.format('HH:mm')}</span>}
                        {
                            this.props.itemData.notificate &&
                            <div className="notification-identifier-wrapper">
                                <img
                                    className="notification-identifier"
                                    src={AlarmImg}
                                    alt="notify"
                                />
                            </div>
                        }
                        {
                            this.props.itemData.repeatType !== "no-repeat" &&
                            <div className="repeat-identifier-wrapper">
                                <img
                                    className="repeat-identifier"
                                    src={RepeatImg}
                                    alt="repeat"
                                />
                            </div>
                        }
                    </div>
                    <div className="title-wrapper">
                        {
                            this.props.itemData.priority !== 2 &&
                            <div className="priority-label">
                                {this.props.itemData.priority === 1 && <div className="arrow bottom green"></div>}
                                {this.props.itemData.priority === 3 && <div className="arrow top blue"></div>}
                                {this.props.itemData.priority === 4 && <div className="arrow top red"></div>}
                            </div>
                        }
                        {!!this.props.itemData.title && <div className="note-title">{this.props.itemData.title}</div>}
                    </div>
                    {
                        this.props.itemData.dynamicFields.map((a, i) => {
                            if (a && a.type === "text") {
                                return (
                                    <div
                                        className="item-data-text"
                                        key={i}
                                    >{a.value}</div>
                                )
                            } else if (a && a.type === "listItem") {
                                return (
                                    <TextCheckBox
                                        key={i}
                                        id={i}
                                        textValue={a.value}
                                        checkBoxValue={a.checked}
                                        onValueChange={this.onDynamicFieldChange}
                                    />
                                )
                            } else if (a && a.type === "snapshot") {
                                if (this.state.expanded) {
                                    return (
                                        <div key={i}
                                             className="attached-image-wrapper">
                                            <img
                                                onClick={this.showImage}
                                                className="attached-image"
                                                src={a.uri}
                                                alt="attachment"
                                            />
                                        </div>
                                    )
                                } else {
                                    return (
                                        <span key={i} className="attached-image-label">{t("attached-image")}</span>
                                    )
                                }
                            }
                            return null
                        })
                    }

                    {
                        (!this.props.context || (this.props.context.name === 'search' && this.props.context.params.searchRepeatType === 'no-repeat')) &&
                        <div className="more-button">
                            <button onClick={this.onDialogRequest}>
                                <img
                                    src={MoreImg}
                                    alt="more"
                                />
                            </button>
                        </div>
                    }
                    {
                        (!this.props.context || (this.props.context.name === 'search' && this.props.context.params.searchRepeatType === 'no-repeat')) &&
                        <div className="note-finish-checkbox">
                            <CustomCheckBox
                                checked={this.props.itemData.finished}
                                onChange={this.onItemFinishChange}
                            />
                        </div>
                    }
                </div>
            </div>
        )
    }
}

export default translate("translations")(Note);