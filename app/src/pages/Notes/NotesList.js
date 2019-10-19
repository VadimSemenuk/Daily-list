import React, {PureComponent} from 'react';
import {translate} from "react-i18next";

import {Note} from './Note/Note';

import Sortable from 'react-sortablejs';

export let NOTES_LIST_CALLBACK_ENUM = {
    DRAG_SORT_MODE_TRIGGER: 1,
    ORDER_CHANGE: 2
};

class _NotesList extends PureComponent {
    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.sortable && (this.props.settings.sortType !== prevProps.settings.sortType)) {
            this.sortable.option('disabled', this.props.settings.sortType !== 2);
        }

        if (this.sortable && (this.props.settings.sortFinBehaviour !== prevProps.settings.sortFinBehaviour)) {
            this.sortable.option('draggable', this.props.settings.sortFinBehaviour === 1 ? ".not-finished" : ".note-wrapper");
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
            let nextManualOrderIndex = order.indexOf(n.key);
            if (nextManualOrderIndex === -1) {
                nextManualOrderIndex = null;
            }

            return {
                ...n,
                manualOrderIndex: nextManualOrderIndex
            }
        })

        this.props.callbackHandler(
            NOTES_LIST_CALLBACK_ENUM.ORDER_CHANGE,
            { nextOrder: nextOrder }
        );
    }

    onDragSortModeTrigger = () => {
        this.props.callbackHandler(NOTES_LIST_CALLBACK_ENUM.DRAG_SORT_MODE_TRIGGER);
    }

    renderItem = (a) => (
        <Note
            key={a.key}
            itemData={a}
            settings={this.props.settings}
            callbackHandler={this.props.noteCallbackHandler}
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
                delay: 400,
                draggable: this.props.settings.sortFinBehaviour === 1 ? ".not-finished" : ".note-wrapper",
                direction: 'vertical',
                onStart: this.props.onDragSortModeTrigger,
                onEnd: this.props.onDragSortModeTrigger
            },
            onChange: this.onOrderChange
        }

        if (this.props.settings.sortFinBehaviour === 1) {
            let notFinished = this.props.notes.filter((a) => !a.finished);
            let finished = this.props.notes.filter((a) => a.finished);

            return (
                <Sortable ref={this.setSortableRef} {...sortableOptions}>
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

export let NotesList = translate("translations")(_NotesList);