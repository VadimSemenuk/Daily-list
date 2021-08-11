import React, {PureComponent} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {withRouter} from "react-router-dom";

import Textarea from "react-textarea-autosize";

import AddImg from "../../assets/img/add-gray.svg";
import CheckedImg from "../../assets/img/tick-black.svg";

import * as AppActions from '../../actions';

import './FastAdd.scss';
import {translate} from "react-i18next";
import {NoteContentItemType, NoteRepeatType} from "../../constants";

class FastAdd extends PureComponent {
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

    add() {
        let note = this.getDefaultNoteData();
        note.tags = this.props.settings.noteFilters.tags.map((id) => this.props.tags.find((tag) => tag.id === id));
        note.contentItems.push({
            type: NoteContentItemType.Text,
            value: this.state.value
        });
    }

    render() {
        let {t} = this.props;

        return (
            <div className="fast-add">
                <Textarea
                    className="textarea"
                    type="text"
                    placeholder={t("fast-add-placeholder")}
                    value={this.state.value}
                    onChange={(e) => this.setState({value: e.target.value})}
                />

                <div className="actions-wrapper">
                    <button onClick={() => {}}>
                        <img
                            src={CheckedImg}
                            alt="button"
                        />
                    </button>
                    <button onClick={() => this.props.history.push({
                            pathname: "/add",
                            state: {
                                props: {
                                    tagsSelected: this.props.settings.noteFilters.tags
                                }
                            }
                        })}>
                        <img
                            src={AddImg}
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
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(withRouter(FastAdd)));