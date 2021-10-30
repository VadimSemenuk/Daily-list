import React, {PureComponent} from 'react';
import {bindActionCreators} from "redux";
import {connect} from "react-redux";
import moment from "moment";
import {translate} from "react-i18next";
import {withRouter} from "react-router-dom";

import * as AppActions from "../../actions";

import deepCopyObject from "../../utils/deepCopyObject";

import {NoteRepeatType} from "../../constants";

import Modal from "../../components/Modal/Modal";
import {ButtonListItem, ListItem} from "../../components/ListItem/ListItem";
import Fab from "../../components/Fab/Fab";
import {triggerNoteFinishState, updateNoteContentItems} from "../../actions";

class NotesActionsHandlerWrapper extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            copyBuffer: null,
            isListItemDialogVisible: false,
            listItemDialogData: null,
        };
    }

    onFinishStateTrigger = (note) => {
        this.props.triggerNoteFinishState(note, this.props.settings.sortFinBehaviour === 1);
    }

    onContentItemsChange = (note, nextContentItems) => {
        this.props.updateNoteContentItems(note, nextContentItems);
    }

    onEditRequest = () => {
        this.props.history.push({
            pathname: "/edit",
            state: {
                props: {
                    note: this.state.listItemDialogData.note
                }
            }
        });
        this.closeDialog();
    };

    onListItemRemove = () => {
        this.props.deleteNote(this.state.listItemDialogData.note);
        this.closeDialog();
    };

    onNoteMoveForTomorrow = () => {
        this.props.moveNoteForDate(this.state.listItemDialogData.note, moment(this.state.listItemDialogData.note.date).add(1, "day").startOf("day"));
        this.closeDialog();
    }

    onNoteMoveForYesterday = () => {
        this.props.moveNoteForDate(this.state.listItemDialogData.note, moment(this.state.listItemDialogData.note.date).subtract(1, "day").startOf("day"));
        this.closeDialog();
    }

    onNoteCopyRequest = () => {
        this.setState({
            copyBuffer: this.state.listItemDialogData.note
        });
        this.closeDialog();
    };

    pasteCopy = async () => {
        let note = deepCopyObject(
            {
                ...this.state.copyBuffer,
                ...{
                    repeatType: NoteRepeatType.NoRepeat,
                    date: moment(this.props.date),
                    repeatValues: []
                }
            }
        );

        await this.props.addNote(note);

        this.setState({
            copyBuffer: null
        });
    };

    setNoteRepeatEndDate = async () => {
        this.props.setNoteRepeatEndDate(this.state.listItemDialogData.note);
        this.closeDialog();
    }

    openDialog = (data) => {
        this.setState({
            isListItemDialogVisible: true,
            listItemDialogData: {note: data}
        });
    };

    onOrderChange = (order) => {
        this.props.updateNotesManualSortIndex(order);
    };

    closeDialog = () => {
        this.setState({
            isListItemDialogVisible: false,
            listItemDialogData: null
        });
    };

    render() {
        let {t} = this.props;

        return (
            <React.Fragment>
                <this.props.List
                    ref={this.props.listRef}
                    {...this.props}
                    onOrderChange={this.onOrderChange}
                    onFinishStateTrigger={this.onFinishStateTrigger}
                    onContentItemsChange={this.onContentItemsChange}
                    onDialogRequest={this.openDialog}
                />
                <Modal
                    className={"note-actions-modal"}
                    isOpen={this.state.isListItemDialogVisible}
                    onRequestClose={this.closeDialog}
                >
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
                    <ButtonListItem
                        className="no-border"
                        text={t("do-copy")}
                        onClick={this.onNoteCopyRequest}
                    />
                    <ListItem
                        className={"note-action-move"}
                        text={t("move-for-date") + ":"}
                        ValElement={() => (
                            <React.Fragment>
                                <button
                                    className="text block"
                                    onClick={this.onNoteMoveForYesterday}
                                >{t("yesterday")}</button>
                                <button
                                    className="text block"
                                    onClick={this.onNoteMoveForTomorrow}
                                >{t("tomorrow")}</button>
                            </React.Fragment>
                        )}
                    />
                    {
                        this.state.listItemDialogData && (this.state.listItemDialogData.note.repeatType !== NoteRepeatType.NoRepeat) &&
                        <ButtonListItem
                            className="no-border"
                            text={t("finish-repeat")}
                            onClick={this.setNoteRepeatEndDate}
                        />
                    }
                </Modal>

                {
                    this.state.copyBuffer &&
                    <Fab onClick={this.pasteCopy} />
                }
            </React.Fragment>
        )
    }
}

function mapStateToProps(state) {
    return {
        date: state.date,
        settings: state.settings
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(withRouter(NotesActionsHandlerWrapper)));
