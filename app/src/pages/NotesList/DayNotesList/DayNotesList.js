import React, {PureComponent} from 'react';

import ListItem from '../ListItem/ListItem';

export default class DayNotesList extends PureComponent {
    render() {
        // console.log("day list render");
        return (
            <div className="notes-list-item-wrapper" >
                {
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
                    <div className="no-content">Нет записей</div>
                }
            </div>
        )
    }
}