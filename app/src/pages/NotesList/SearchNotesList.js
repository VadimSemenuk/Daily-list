import React, {PureComponent} from 'react';
import {translate} from "react-i18next";

import ListItem from "./ListItem/ListItem";

import "./SearchNotesList.scss";

class SearchNotesList extends PureComponent {
    constructor(props) {
        super(props);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        let el = document.querySelector("[data-is-closest-to-current-date='true']");
        el && el.scrollIntoView();
    }

    renderItem = (a) => (
        <ListItem
            key={a.key}
            itemData={a}
            settings={this.props.settings}
            onDynamicFieldChange={this.props.onItemDynamicFieldChange}
            onItemActionsWindowRequest={this.props.onItemActionsWindowRequest}
        />
    );

    render() {
        let {t} = this.props;

        return (
            <div className={"search-results-wrapper"}>
                {
                    (this.props.searchRepeatType === "no-repeat") && (this.props.notesScreenMode === 1) && (this.props.notes.length !== 0) && this.props.notes.map((item, index) => (
                        <div key={index}
                             className={"date-item"}
                             data-is-closest-to-current-date={item.isClosestToCurrentDate}>
                            <div className={"date-item-date"}>{item.date.format("DD MMM YYYY")}</div>
                            {
                                item.notes.map(this.renderItem)
                            }
                        </div>
                    ))
                }
                {
                    (this.props.searchRepeatType === "repeat") && (this.props.notesScreenMode === 1) && (this.props.notes.length !== 0) && this.props.notes.map(this.renderItem)
                }
                {
                    (this.props.notesScreenMode === 2) && (this.props.notes.length !== 0) && this.props.notes.map(this.renderItem)
                }
                {
                    !this.props.notes.length &&
                    <div className="no-content">{t("no-search-content")}</div>
                }
            </div>
        )
    }
}

export default translate("translations")(SearchNotesList);