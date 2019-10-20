import React, {PureComponent} from 'react';
import {translate} from "react-i18next";
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import moment from "moment";
import {withRouter} from "react-router-dom";

import TextCheckBox from '../../../components/TextCheckBox/TextCheckBox';
import CustomCheckBox from '../../../components/CustomCheckBox/CustomCheckBox';
import {ButtonListItem} from "../../../components/ListItem/ListItem";
import Modal from "../../../components/Modal/Modal";

import AlarmImg from '../../../assets/img/alarm.svg';
import MoreImg from "../../../assets/img/more.svg";
import RepeatImg from "../../../assets/img/two-circling-arrows.svg";
import DownArrowGreenImg from "../../../assets/img/down-arrow-green.svg";
import DownArrowBlueImg from "../../../assets/img/down-arrow-blue.svg";
import DownArrowRedImg from "../../../assets/img/down-arrow-red.svg";

import * as AppActions from '../../../actions';

import './Note.scss';

class Note extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            expanded: false,
            isListItemDialogVisible: false,
        };
    }

    onDynamicFieldChange = (i, v) => {
        let nextDynamicFields = [
            ...this.props.itemData.dynamicFields.slice(0, i),
            {
                ...this.props.itemData.dynamicFields[i],
                checked: v
            },
            ...this.props.itemData.dynamicFields.slice(i + 1)
        ];

        this.props.updateNoteDynamicFields(this.props.itemData, {dynamicFields: nextDynamicFields});
    };

    onItemFinishChange = (v) => {
        this.props.updateNoteDynamicFields(this.props.itemData, {finished: v});
    };

    triggerExpanded = () => {
        this.setState({expanded: !this.state.expanded});
    };

    showImage = (e) => {
        e.stopPropagation();
        
        window.PhotoViewer.show(e.target.src, this.props.itemData.title, {share: false});         
    };

    openDialog = (e) => {
        e.stopPropagation();

        this.setState({
            isListItemDialogVisible: true,
        });
    };

    closeDialog = () => {
        this.setState({
            isListItemDialogVisible: false
        });
    };

    onEditRequest = () => {
        this.closeDialog();

        this.props.history.push({
            pathname: "/edit",
            state: { note: this.props.itemData }
        });
    };

    onListItemRemove = () => {
        this.closeDialog();

        this.props.deleteNote(this.props.itemData);
    };

    onListItemMove = async () => {
        this.closeDialog();

        let nextDate = moment(this.props.itemData.added).add(1, "day");
        await this.props.updateNoteDate(this.props.itemData, nextDate);
    };

    onCopyRequest = () => {
        this.closeDialog();

        this.props.onCopyRequest(this.props.itemData);
    }

    render () {
        let {t} = this.props;
        
        return (
            <div
                data-id={this.props.itemData.key}
                className={`note-wrapper ${(this.state.expanded || !this.props.settings.minimizeNotes) && 'expanded'} ${!this.props.settings.minimizeNotes && 'force-expanded'} ${this.props.itemData.finished && 'finished'} ${!this.props.itemData.finished && 'not-finished'}`}
            >
                <div
                    style={{backgroundColor: this.props.itemData.tag}}
                    className="tag"
                ></div>
                {
                    this.props.itemData.priority === 11 &&
                    <img
                        className="note-header-priority"
                        src={DownArrowGreenImg}
                        alt="low"
                    />
                }
                {
                    this.props.itemData.priority === 13 &&
                    <img
                        className="note-header-priority rotated"
                        src={DownArrowBlueImg}
                        alt="high"
                    />
                }
                {
                    this.props.itemData.priority === 14 &&
                    <img
                        className="note-header-priority rotated"
                        src={DownArrowRedImg}
                        alt="very high"
                    />
                }
                <div
                    className="note-content"
                    onClick={this.triggerExpanded}
                >
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
                    {!!this.props.itemData.title && <div className="note-title">{this.props.itemData.title}</div>}
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
                        this.props.context !== 'search' &&
                        <div className="more-button">
                            <button onClick={this.openDialog}>
                                <img
                                    src={MoreImg}
                                    alt="more"
                                />
                            </button>
                        </div>
                    }
                    {
                        this.props.context !== 'search' &&
                        <div className="note-finish-checkbox">
                            <CustomCheckBox
                                checked={this.props.itemData.finished}
                                onChange={this.onItemFinishChange}
                            />
                        </div>
                    }
                </div>

                <Modal
                    isOpen={this.state.isListItemDialogVisible}
                    onRequestClose={this.closeDialog}
                >
                    {
                        (this.props.itemData.repeatType === "no-repeat") &&
                        (this.props.settings.notesScreenMode === 1) &&
                        (this.props.context !== 'search') &&
                        <ButtonListItem
                            className="no-border"
                            text={t("move-tomorrow")}
                            onClick={this.onListItemMove}
                        />
                    }
                    <ButtonListItem
                        className="no-border"
                        text={t("edit")}
                        onClick={this.onEditRequest}
                    />
                    <ButtonListItem
                        className="no-border"
                        text={t("delete")}
                        onClick={this.onListItemRemove}
                    />
                    {
                        !!this.props.onCopyRequest &&
                        <ButtonListItem
                            className="no-border"
                            text={t("do-copy")}
                            onClick={this.onCopyRequest}
                        />
                    }
                </Modal>
            </div>
        )
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default withRouter(translate("translations")(connect(null, mapDispatchToProps)(Note)));