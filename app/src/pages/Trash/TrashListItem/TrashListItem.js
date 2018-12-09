import React, {PureComponent} from 'react';
import {translate} from "react-i18next";

import Note from "../../NotesList/ListItem/ListItem";

import './TrashListItem.scss';

import RestoreImg from '../../../assets/img/restore.svg';

class TrashListItem extends PureComponent { 
    constructor(props) {
        super(props);
    }

    onRestore = () => this.props.onRestore(this.props.itemData);

    render () {
        let {t} = this.props;
        
        return (
            <div className="trash-list-item">
                <div className="deleted-time">Deleted: {this.props.itemData.lastActionTime.format("MMM Do YYYY, HH:mm")}</div>
                <Note {...this.props} />
                <button 
                    className="restore-button"
                    onClick={this.onRestore}
                >
                    <img src={RestoreImg} alt="restore" />
                </button>
            </div>
        )
    }
}

export default translate("translations")(TrashListItem)