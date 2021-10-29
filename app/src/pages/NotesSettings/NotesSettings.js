import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";

import * as AppActions from '../../actions';

import Header from '../../components/Header/Header';
import {SwitchListItem} from "../../components/ListItem/ListItem";

import './NotesSettings.scss';

class NotesSettings extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let {t} = this.props;

        return (
            <div className="page-wrapper">
                <Header title={t("view")} />
                <div className="scroll page-content padding">
                    <SwitchListItem
                        text={t("default-notification")}
                        checked={this.props.settings.defaultNotification}
                        onChange={(e) => this.props.setSetting({defaultNotification: e})}
                    />
                    <SwitchListItem
                        text={t("finished-notes-notifications")}
                        checked={this.props.settings.defaultNotification}
                        onChange={(e) => this.props.setSetting({defaultNotification: e})}
                    />
                    <SwitchListItem
                        text={t("auto-move-not-completed")}
                        checked={this.props.settings.autoMoveNotFinishedNotes}
                        onChange={(e) => this.props.setSetting({autoMoveNotFinishedNotes: e})}
                    />
                </div>
            </div>
        );
    }

}    

function mapStateToProps(state) {
    return {
        settings: state.settings,
        currentDate: state.date        
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(NotesSettings));