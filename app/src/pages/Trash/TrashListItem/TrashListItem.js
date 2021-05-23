import React, {PureComponent} from 'react';
import {translate} from "react-i18next";

import Note from "../../Notes/Note/Note";

import './TrashListItem.scss';

import RestoreImg from '../../../assets/img/restore.svg';

class TrashListItem extends PureComponent {
    onRestore = () => this.props.onRestore(this.props.data);

    render () {
        let {t} = this.props;

        return (
            <div className="trash-list-item">
                <div className="trash-list-item-header">
                    <div className="deleted-time">{t('deleted-date')}: {this.props.data.lastActionTime.format("MMM Do YYYY, HH:mm")}</div>
                    <button
                        className="restore-button"
                        onClick={this.onRestore}
                    >
                        <img src={RestoreImg} alt="restore" />
                    </button>
                </div>
                <Note
                    {...this.props}
                    isActionsViewVisible={false}
                />
            </div>
        )
    }
}

export default translate("translations")(TrashListItem)