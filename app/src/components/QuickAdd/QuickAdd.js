import React, {PureComponent} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import moment from "moment";
import {translate} from "react-i18next";
import Textarea from "react-textarea-autosize";

import CheckedImg from "../../assets/img/tick-black.svg";

import * as AppActions from '../../actions';

import {NoteContentItemType, NoteRepeatType} from "../../constants";

import './QuickAdd.scss';

class QuickAdd extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            value: ""
        }
    }

    getDefaultNoteData = () => {
        return {
            title: "",
            contentItems: [],
            isNotificationEnabled: false,
            startTime: null,
            endTime: null,
            tag: 'transparent',
            date: moment(this.props.date),
            isFinished: false,
            repeatType: NoteRepeatType.NoRepeat,
            repeatValues: [],
            mode: this.props.settings.notesScreenMode,
            tags: []
        }
    }

    updateValue = (event) => {
        let moveCaretToPosition = null;
        let nextValue = event.target.value;

        if (this.isNewRowAdded(this.state.value, nextValue) && event) {
            let rows = this.state.value.split("\n");
            let cursorPos = event.target.selectionStart;

            let charCounter = 0;
            let targetRowIndex = null;
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];

                charCounter += row.length + 1;
                if (charCounter >= cursorPos) {
                    targetRowIndex = i;
                    break;
                }
            }

            if (targetRowIndex !== null) {
                if (rows[targetRowIndex][0] === "-") {
                    let nextTargetRow = rows[targetRowIndex];
                    if (/^-\S+/.test(nextTargetRow)) {
                        nextTargetRow = nextTargetRow.replace("-", "- ");
                    } else {
                        nextTargetRow = nextTargetRow.replace(/^-\s+/, "- ");
                    }
                    nextTargetRow += "\n- ";

                    let _nextValue = [
                        ...rows.slice(0, targetRowIndex),
                        nextTargetRow,
                        ...rows.slice(targetRowIndex + 1)
                    ].join("\n");
                    nextValue = _nextValue;

                    let nextCursorPosition = [
                        ...rows.slice(0, targetRowIndex),
                        nextTargetRow
                    ].reduce((acc, item) => acc += item.length + 1, 0) - 1;
                    moveCaretToPosition = nextCursorPosition;
                }
            }
        }

        this.setState({value: nextValue});

        if (moveCaretToPosition !== null) {
            setTimeout(() => {
                let el = document.querySelector(".quick-add textarea");
                el && el.setSelectionRange(moveCaretToPosition, moveCaretToPosition);
            });
        }
    }

    isNewRowAdded = (prevValue, value) => prevValue.split("\n").length < value.split("\n").length

    add = () => {
        let note = this.getDefaultNoteData();
        note.tags = this.props.settings.noteFilters.tags.map((id) => this.props.tags.find((tag) => tag.id === id));
        note.contentItems.push({
            type: NoteContentItemType.Text,
            value: this.state.value
        });

        this.props.addNote(note);

        this.setState({value: ""});
    }

    render() {
        let {t} = this.props;

        return (
            <div className="quick-add">
                <Textarea
                    className="textarea"
                    type="text"
                    placeholder={t("quick-add-placeholder")}
                    value={this.state.value}
                    onChange={this.updateValue}
                />

                <div className="actions-wrapper">
                    <button onClick={this.add}>
                        <img
                            src={CheckedImg}
                            alt="button"
                        />
                    </button>
                </div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        settings: state.settings,
        date: state.date,
        tags: state.tags
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(QuickAdd));