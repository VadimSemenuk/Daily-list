import React, {PureComponent} from 'react';
import {translate} from "react-i18next";

import TextCheckBox from '../../../components/TextCheckBox/TextCheckBox';
import CustomCheckBox from '../../../components/CustomCheckBox/CustomCheckBox';

import AlarmImg from '../../../assets/img/alarm.svg';
import MoreImg from "../../../assets/img/more.svg";
import RepeatImg from "../../../assets/img/repeat.svg";

import './Note.scss';
import {NoteRepeatType} from "../../../constants";

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
            ...this.props.itemData.contentItems.slice(0, i),
            {
                ...this.props.itemData.contentItems[i],
                checked: v
            },
            ...this.props.itemData.contentItems.slice(i + 1)
        ];

        this.props.onDynamicFieldChange(this.props.itemData, {contentItems: nextDynamicFields});
    };

    onItemFinishChange = (v) => {
        this.props.onDynamicFieldChange(this.props.itemData, {isFinished: v});
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
                data-id={this.props.itemData.id}
                className={`note-wrapper ${(this.state.expanded || !this.props.settings.minimizeNotes) && 'expanded'} ${!this.props.settings.minimizeNotes && 'force-expanded'} ${this.props.itemData.isFinished && 'finished'} ${!this.props.itemData.isFinished && 'not-finished'}`}
                onClick={this.triggerExpanded}
            >
                <div
                    style={{backgroundColor: this.props.itemData.tag}}
                    className="tag"
                ></div>
                <div className="note-content">
                    <div className="note-header">
                        {this.props.itemData.startTime && <span className="note-header-time">{this.props.itemData.startTime.format('HH:mm')}</span>}
                        {this.props.itemData.endTime && <span className="note-header-time-divider">-</span>}
                        {this.props.itemData.endTime && <span className="note-header-time">{this.props.itemData.endTime.format('HH:mm')}</span>}
                        {
                            this.props.itemData.isNotificationEnabled &&
                            <div className="notification-identifier-wrapper">
                                <img
                                    className="notification-identifier"
                                    src={AlarmImg}
                                    alt="notify"
                                />
                            </div>
                        }
                        {
                            this.props.itemData.repeatType !== NoteRepeatType.NoRepeat &&
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
                        {!!this.props.itemData.title && <div className="note-title">{this.props.itemData.title}</div>}
                    </div>
                    {
                        this.props.itemData.contentItems.map((a, i) => {
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
                                if (this.state.expanded || !this.props.settings.minimizeNotes) {
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
                                checked={this.props.itemData.isFinished}
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