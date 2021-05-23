import React, {PureComponent} from 'react';
import {translate} from "react-i18next";
import {bindActionCreators} from "redux";
import Sortable from 'react-sortablejs';
import {connect} from "react-redux";

import * as AppActions from "../../actions";

import Note from './Note/Note';

class NotesList extends PureComponent {
    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.sortable && (this.props.settings.sortType !== prevProps.settings.sortType)) {
            this.sortable.option('disabled', this.props.settings.sortType !== 2);
        }
    }

    setSortableRef = (node) => {
        if (node) {
            this.sortable = node.sortable;
        }
    }

    onOrderChange = (order) => {
        order = order.map((key) => +key);
        if (this.props.settings.sortDirection === 0) {
            order.reverse();
        }

        let nextOrder = this.props.notes.map((n) => {
            let nextManualOrderIndex = order.indexOf(n.id);
            if (nextManualOrderIndex === -1) {
                nextManualOrderIndex = null;
            }

            return {
                ...n,
                manualOrderIndex: nextManualOrderIndex
            }
        });

        this.props.onOrderChange(nextOrder);
    }

    onDragSortModeEnable = () => {
        this.props.onDragSortModeTrigger(true);
    }

    onDragSortModeDisable = () => {
        this.props.onDragSortModeTrigger(false);
    }

    renderItem = (a) => (
        <Note
            key={a.id}
            data={a}
            minimize={this.props.settings.minimizeNotes}
            onNoteChange={this.props.onNoteChange}
            onDialogRequest={this.props.onDialogRequest}
        />
    );

    render() {
        let {t} = this.props;

        if (!this.props.notes.length) {
            return <div className="no-content">{t("no-content")}</div> 
        }

        let sortableOptions = {
            options: {
                disabled: this.props.settings.sortType !== 2,
                delay: 300,
                draggable: ".not-finished",
                direction: 'vertical',
                onStart: this.onDragSortModeEnable,
                onEnd: this.onDragSortModeDisable
            },
            onChange: this.onOrderChange
        }

        if (this.props.settings.sortFinBehaviour === 1) {
            let notFinished = this.props.notes.filter((a) => !a.isFinished);
            let finished = this.props.notes.filter((a) => a.isFinished);

            return (
                <Sortable
                    ref={this.setSortableRef}
                    {...sortableOptions}
                >
                    {
                        notFinished.map(this.renderItem)
                    }
                    {
                        finished.length !== 0 && <div className="finished-split"><span className="finished-split-content">{t("finished-split")}</span></div>
                    }
                    {
                        finished.map(this.renderItem)
                    }
                </Sortable>
            )
        } else {
            return (
                <Sortable {...sortableOptions}>
                    {this.props.notes.map(this.renderItem)}
                </Sortable>
            )
        }
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(null, mapDispatchToProps)(NotesList));
