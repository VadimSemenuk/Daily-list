import React, {PureComponent} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";

import Header from '../../components/Header/Header';
import Note from "../Notes/Note/Note";
import Modal from "../../components/Modal/Modal";
import {ButtonListItem} from "../../components/ListItem/ListItem";

import * as AppActions from '../../actions';

import './NotesSearch.scss';
import NotesList from "../Notes/NotesList";

class NotesSearch extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            searchRepeatType: "no-repeat",
            searchText: "",
            isListItemDialogVisible: false,
            listItemDialogData: null,
        };

        this.needToScrollToClosest = false;
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.needToScrollToClosest && prevProps.search != this.props.search) {
            let el = document.querySelector("[data-is-closest-to-current-date='true']");
            el && el.scrollIntoView();

            this.needToScrollToClosest = false;
        }
    }

    componentWillUnmount() {
        this.props.resetSearch();
    }

    onSearchTextChange = (e) => {
        let nextSearchText = e.target.value;

        this.setState({searchText: nextSearchText});
        this.props.searchNotes(nextSearchText, this.state.searchRepeatType);
        this.needToScrollToClosest = true;
    };

    triggerSearchType = () => {
        this.props.resetSearch();
        let nextSearchType = this.state.searchRepeatType === "no-repeat" ? "repeat" : "no-repeat";
        this.props.searchNotes(this.state.searchText, nextSearchType);
        this.setState({searchRepeatType: nextSearchType});
    };

    onDynamicFieldChange = (itemData, updatedState) => {
        this.props.updateNoteDynamicFields(itemData, updatedState);
    }

    onDialogRequest = (data) => {
        this.openDialog(data);
    }

    openDialog = (data) => {
        this.setState({
            isListItemDialogVisible: true,
            listItemDialogData: {note: data}
        });
    };

    closeDialog = () => {
        this.setState({
            isListItemDialogVisible: false,
            listItemDialogData: null
        });
    };

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

    renderItem = (a) => (
        <Note
            key={a.key}
            itemData={a}
            settings={this.props.settings}
            context={{name: 'search', params: {searchRepeatType: this.state.searchRepeatType}}}
            onDynamicFieldChange={this.onDynamicFieldChange}
            onDialogRequest={this.onDialogRequest}
        />
    );

    render() {
        let {t} = this.props;

        return (
            <div className="page-wrapper">
                <Header page="search"/>
                <div className="search-notes-wrapper page-content">
                    {
                        this.props.settings.notesScreenMode === 1 &&
                        <div className={'search-mode-select-wrapper theme-header-background theme-header-border'}>
                            <span>Показать: </span>
                            <button
                                className={`button ${this.state.searchRepeatType === 'no-repeat' ? 'active' : ''}`}
                                onClick={this.triggerSearchType}
                            >{t("show-no-repeat-notes")}</button>
                            <button
                                className={`button ${this.state.searchRepeatType === 'repeat' ? 'active' : ''}`}
                                onClick={this.triggerSearchType}
                            >{t("show-repeat-notes")}</button>
                        </div>
                    }
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder={t('search-placeholder')}
                            value={this.state.searchText}
                            onChange={this.onSearchTextChange} />
                    </div>

                    <div className="notes-list">
                        {
                            this.props.search.length !== 0 &&
                            <React.Fragment>
                                {
                                    (this.state.searchRepeatType === "no-repeat")
                                    && (this.props.settings.notesScreenMode === 1)
                                    && this.props.search.map((item, index) => (
                                        <div key={index}
                                             className={"date-item"}
                                             data-is-closest-to-current-date={item.isClosestToCurrentDate}>
                                            <div className={"date-item-date"}>{item.date.format("DD MMM YYYY")}</div>
                                            {
                                                item.items.map(this.renderItem)
                                            }
                                        </div>
                                    ))
                                }
                                {
                                    (this.state.searchRepeatType === "repeat")
                                    && (this.props.settings.notesScreenMode === 1)
                                    && this.props.search.map(this.renderItem)
                                }
                                {
                                    (this.props.settings.notesScreenMode === 2)
                                    && this.props.search.map(this.renderItem)
                                }
                            </React.Fragment>
                        }
                        {
                            this.props.search.length === 0 &&
                            <div className="no-content">{t("no-search-content")}</div>
                        }
                    </div>
                </div>

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
                </Modal>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        settings: state.settings,
        search: state.search.map((a) => {
            return {
                ...a,
                items: a.items.slice().sort((a, b) => a.key - b.key)
            }
        })
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(NotesSearch));