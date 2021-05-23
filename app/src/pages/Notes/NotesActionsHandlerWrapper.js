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
import {ButtonListItem} from "../../components/ListItem/ListItem";
import Fab from "../../components/Fab/Fab";

class NotesActionsHandlerWrapper extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            copyBuffer: null,
            isListItemDialogVisible: false,
            listItemDialogData: null,
        };
    }

    onNoteChange = (itemData, updatedState) => {
        this.props.updateNoteDynamic(itemData, updatedState);
    }

    onEditRequest = () => {
        this.closeDialog();

        this.props.history.push({
            pathname: "/edit",
            state: { note: this.state.listItemDialogData.note }
        });
    };

    onListItemRemove = () => {
        this.closeDialog();

        this.props.deleteNote(this.state.listItemDialogData.note);
    };

    onNoteCopyRequest = () => {
        this.closeDialog();

        this.setState({
            copyBuffer: this.state.listItemDialogData.note
        });
    };

    pasteCopy = async () => {
        let note = deepCopyObject(Object.assign(this.state.copyBuffer, {
            repeatType: NoteRepeatType.NoRepeat,
            date: moment(this.props.date)
        }));

        await this.props.addNote(note);

        this.setState({
            copyBuffer: null
        });
    };

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
                    onNoteChange={this.onNoteChange}
                    onDialogRequest={this.openDialog}
                />
                <Modal
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
        date: state.date
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(withRouter(NotesActionsHandlerWrapper)));
