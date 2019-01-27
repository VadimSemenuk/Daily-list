import React, {PureComponent} from 'react';

import Note from "../../NotesList/ListItem/ListItem";

import './TrashListItem.scss';

import RestoreImg from '../../../assets/img/restore.svg';

class TrashListItem extends PureComponent {
    onRestore = () => this.props.onRestore(this.props.itemData);

    render () {
        return (
            <div className="trash-list-item">
                <div className="trash-list-item-header">
                    <div className="deleted-time">Deleted: {this.props.itemData.lastActionTime.format("MMM Do YYYY, HH:mm")}</div>
                    <button
                        className="restore-button"
                        onClick={this.onRestore}
                    >
                        <img src={RestoreImg} alt="restore" />
                    </button>
                </div>
                <Note {...this.props} />
            </div>
        )
    }
}

export default TrashListItem