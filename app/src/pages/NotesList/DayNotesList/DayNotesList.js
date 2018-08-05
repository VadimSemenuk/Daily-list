import React, {PureComponent} from 'react';
import {translate, Trans} from "react-i18next";

import ListItem from '../ListItem/ListItem';

class DayNotesList extends PureComponent {
    render() {
        let {t} = this.props;
        // console.log("day list render");
        return (
            this.props.notes.length ? 
            this.props.notes.map((a, i) => (
                <ListItem 
                    key={a.key}
                    index={i}
                    dayIndex={this.props.index}
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