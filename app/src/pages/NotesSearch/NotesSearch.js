import React, {PureComponent} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";

import Header from '../../components/Header/Header';
import Note from "../Notes/Note/Note";

import {throttle} from "../../utils/throttle";

import * as AppActions from '../../actions';

import {NotesScreenMode} from "../../constants";

import './NotesSearch.scss';

class NotesSearch extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            searchText: "",
        };

        this.needToScrollToClosest = false;
        this.result = null;
    }

    componentDidMount() {
        let inputEl = document.querySelector(`.search-input-wrapper input`);
        if (inputEl) {
            inputEl.focus();
        }
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

        if (this.props.location.state && this.props.location.state.onResult) {
            this.props.location.state.onResult(this.result);
        }
    }

    onSearchTextChange = (e) => {
        let nextSearchText = e.target.value;

        this.setState({searchText: nextSearchText});
        this.searchNotesThrottled(nextSearchText);
        this.needToScrollToClosest = true;
    }

    searchNotesThrottled = throttle((nextSearchText) => {
        this.props.searchNotes(nextSearchText);
    }, 500);

    onNoteClick = (note) => {
        this.result = note;
        this.props.history.goBack();
    }

    renderItem = (item) => (
        <div
            className="search-result-item"
            key={item.id}
        >
            <div
                className="fill"
                onClick={() => this.onNoteClick(item)}
            ></div>
            <Note
                itemData={item}
                settings={this.props.settings}
                isActionsViewVisible={false}
                onDynamicFieldChange={this.onDynamicFieldChange}
                onDialogRequest={this.onDialogRequest}
            />
        </div>
    );

    render() {
        let {t} = this.props;

        return (
            <div className="page-wrapper">
                <Header title={t("search")}/>
                <div className="search-notes-wrapper page-content">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder={t('search-placeholder')}
                            value={this.state.searchText}
                            onChange={this.onSearchTextChange} />
                    </div>

                    <div className="search-result-list">
                        {
                            this.props.search.map((item, index) => (
                                <div key={index}
                                     className={"date-item"}
                                     data-is-closest-to-current-date={item.isClosestToCurrentDate}>
                                    {
                                        this.props.settings.notesScreenMode === NotesScreenMode.WithDateTime && <div className={"date-item-date"}>{item.date.format("DD MMM YYYY")}</div>
                                    }
                                    {
                                        item.items.map(this.renderItem)
                                    }
                                </div>
                            ))
                        }
                        {
                            this.props.search.length === 0 &&
                            <div className="no-content">{t("no-search-content")}</div>
                        }
                    </div>
                </div>
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
                items: a.items.slice().sort((a, b) => a.id - b.id)
            }
        })
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(NotesSearch));