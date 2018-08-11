import React, {PureComponent} from 'react';
import {translate} from "react-i18next";

import ListItem from './ListItem/ListItem';

import AddGeryImg from '../../assets/img/add-grey.svg';

class DayNotesList extends PureComponent {
    render() {
        console.log(this.props.notes);
        let {t} = this.props;

        return (
            this.props.notes.map((dayNotes, dayNotesIndex) => (
                <div key={dayNotesIndex}>
                    <div className="week-header">
                        <img 
                            src={AddGeryImg}
                            alt="remove"
                        />
                        <span>{dayNotes.date.locale("ru").format("dddd")}</span>
                    </div>                    

                    {
                        dayNotes.items.length ?
                        dayNotes.items.map((a, i) => (
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
                    }
                </div>
            ))
        )
    }
}

export default translate("translations")(DayNotesList)