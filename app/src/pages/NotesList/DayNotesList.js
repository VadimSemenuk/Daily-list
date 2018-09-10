import React, {PureComponent} from 'react';
import {translate} from "react-i18next";

import ListItem from './ListItem/ListItem';

class DayNotesList extends PureComponent {
    render() {
        let {t} = this.props;
        
        return (
            this.props.notes.length ?
            this.props.notes.map((a, i) => (
                <ListItem 
                    key={a.key}
                    itemData={a} 
                    onShowImage={this.props.onImageShowRequest}
                    onItemFinishChange={this.props.onItemFinishChange}
                    onDynaicFieldChange={this.props.onItemDynaicFieldChange}
                    onItemActionsWindowRequest={this.props.onItemActionsWindowRequest}
                /> 
            ))
            :
            <div className="no-content">{t("no-content")}</div> 
        )
    }
}

export default translate("translations")(DayNotesList)