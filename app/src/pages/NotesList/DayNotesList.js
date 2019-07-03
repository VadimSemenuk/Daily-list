import React, {PureComponent} from 'react';
import {translate} from "react-i18next";

import ListItem from './ListItem/ListItem';

import Sortable from 'react-sortablejs';

class DayNotesList extends PureComponent {
    onOrderChange = (order) => {
        order = order.map((key) => +key);
        if (this.props.settings.sortDirection === 0) {
            order.reverse();
        }

        this.props.onOrderChange(
            this.props.notes.map((n) => {
                let nextManualOrderIndex = order.indexOf(n.key);
                if (nextManualOrderIndex === -1) {
                    nextManualOrderIndex = null;
                }

                return {
                    ...n,
                    manualOrderIndex: nextManualOrderIndex
                }
            })
        );
    }

    renderItem = (a) => (
        <ListItem
            key={a.key}
            itemData={a}
            onShowImage={this.props.n}
            settings={this.props.settings}
            onDynaicFieldChange={this.props.onItemDynamicFieldChange}
            onItemActionsWindowRequest={this.props.onItemActionsWindowRequest}
        />
    );
    
    render() {
        let {t} = this.props;

        if (!this.props.notes.length) {
            return <div className="no-content">{t("no-content")}</div> 
        }

        let sortableOptions = {
            options: {
                disabled: false,
                delay: 500,
                draggable: ".draggable",
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
                <Sortable {...sortableOptions}>
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

export default translate("translations")(DayNotesList);