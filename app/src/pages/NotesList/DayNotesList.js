import React, {PureComponent} from 'react';
import {translate} from "react-i18next";

import ListItem from './ListItem/ListItem';

class DayNotesList extends PureComponent {
    renderItem = (a) => (
        <ListItem 
            key={a.key}
            itemData={a} 
            onShowImage={this.props.onImageShowRequest}
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

        if (this.props.finSort) {
            let notFinished = this.props.notes.filter((a) => !a.finished);
            let finished = this.props.notes.filter((a) => a.finished);

            return (
                <div>
                    {
                        notFinished.map(this.renderItem)
                    }
                    {
                        finished.length !== 0 && <div className="finished-split"><span className="finished-split-content">{t("finished-split")}</span></div>
                    }
                    {
                        finished.map(this.renderItem)
                    }
                </div>
            )
        } else {
            return (
                this.props.notes.map(this.renderItem)
            )
        }
    }
}

export default translate("translations")(DayNotesList)