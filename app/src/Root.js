import React, { Component } from 'react';
import {HashRouter, Route, Redirect, withRouter} from 'react-router-dom';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";
import moment from "moment";

import * as AppActions from './actions'; 

import NotesList from './pages/NotesList/NotesList';
import Add from './pages/Add/Add';
import Password from './pages/Password/Password';
import Settings from './pages/Settings/Settings';
import SettingsTheme from './pages/Theme/SettingsTheme';
import SettingsSort from './pages/Sort/SettingsSort';
import SettingsPassword from './pages/Password/SettingsPassword';
import SettingsBackup from './pages/Backup/SettingsBackup';
import Trash from './pages/Trash/Trash';
import About from './pages/About/About';
import Loader from "./components/Loader/Loader";
import Modal from "./components/Modal/Modal";

import authService from "./services/auth.service";
import deviceService from "./services/device.service";

class Root extends Component {
    constructor(props) {
        super(props);

        this.state = {
            backupMigrationModal: false,
            noBackupNotificationModal: false
        };
    }

    componentDidMount() {
        this.setKeyboardEvents();
        Modal.init();
        this.backupNotes();

        if (!this.props.meta.backupMigrated) {
            this.backupMigrationNotification();
        } else {
            this.showNoBackupNotificationIfNeed();
        }
    }

    setKeyboardEvents() {
        window.addEventListener('keyboardDidShow', () => {
            document.querySelector(".hide-with-active-keyboard").classList.add("hidden");
            setTimeout(function() {
                document.activeElement.scrollIntoViewIfNeeded();
            }, 200);
        });
        window.addEventListener('keyboardDidHide', () => {
            document.querySelector(".hide-with-active-keyboard").classList.remove("hidden"); 
            setTimeout(function() {
                document.activeElement.scrollIntoViewIfNeeded();
            }, 200);           
        });
    }
       
    backupMigrationNotification() {
        if (this.props.user && this.props.user.id) {
            authService.googleSignOut();
        }
        this.setState({
            backupMigrationModal: true
        });
    }

    discardBackupMigrationModal = () => {
        this.props.setBackupMigrationState(true);
    };

    closeBackupMigrationModal = () => {
        this.setState({
            backupMigrationModal: false
        });
    };

    backupNotes = () => {
        if (
            this.props.meta.backupMigrated
            && this.props.user
            && this.props.user.settings.autoBackup
            && deviceService.hasNetworkConnection()
        ) {
            this.props.uploadBatchBackup(true);
        }   
    };

    showNoBackupNotificationIfNeed = () => {
        if (
            this.props.user
            && this.props.user.settings.autoBackup
            && ((this.props.user.backup.lastBackupTime || moment().startOf("day")).diff(this.props.meta.appInstalledDate, 'days') > 30)
        ) {
            this.triggerNoBackupNotificationDialog();
        }
    };

    triggerNoBackupNotificationDialog = () => {
        this.setState({
            noBackupNotificationModal: !this.state.noBackupNotificationModal
        })
    };

    render() {
        let {t} = this.props;

        return (
            <HashRouter>
                <div className="app-wrapper">
                    {
                        !this.props.password &&
                        <Redirect from="/" to="/password"/>           
                    }             
                    <Route 
                        path="/" 
                        component={NotesList}
                    />
                    <Route 
                        exact 
                        path="/add" 
                        component={Add}
                    />
                    <Route 
                        exact 
                        path="/edit" 
                        component={Add}
                    />  
                    <Route 
                        exact 
                        path="/password" 
                        component={Password}
                    /> 
                    <Route 
                        path="/settings" 
                        component={Settings} 
                    />
                    <Route 
                        exact 
                        path="/settings/sort" 
                        component={SettingsSort} 
                    />  
                    <Route 
                        exact 
                        path="/settings/theme" 
                        component={SettingsTheme} 
                    />       
                    <Route 
                        exact 
                        path="/settings/password" 
                        component={SettingsPassword} 
                    />     
                    <Route 
                        exact 
                        path="/settings/backup" 
                        component={SettingsBackup} 
                    />
                    <Route 
                        exact 
                        path="/settings/about" 
                        component={About} 
                    />             
                    <Route 
                        path="/trash" 
                        component={Trash} 
                    />
                    <Loader />

                    <Route render={props => (
                        <Modal
                            isOpen={this.state.backupMigrationModal}
                            onRequestClose={this.closeBackupMigrationModal}
                            actionItems={[
                                {
                                    text: t("move-to-backup-page"),
                                    onClick: () => props.history.push(`/settings/backup`)
                                },
                                {
                                    text: t("re-enter-discard-button"),
                                    onClick: this.discardBackupMigrationModal
                                }
                            ]}
                        >
                            <h3>{t("attention")}</h3>
                            <p>{t("re-enter-request-description")}</p>
                        </Modal>
                    )}/>

                    <Modal 
                        isOpen={this.props.error}
                        onRequestClose={this.props.triggerErrorModal}
                        actionItems={[
                            {
                                text: t("close")
                            },
                            {
                                text: t("error-reload-app"),
                                onClick: () => window.location.reload(true)
                            },
                        ]}
                    >{t(this.props.error.message)}</Modal>

                    <Route render={props => (
                        <Modal
                            isOpen={this.state.noBackupNotificationModal}
                            onRequestClose={this.triggerNoBackupNotificationDialog}
                            actionItems={[
                                {
                                    text: t("close")
                                },
                                {
                                    text: t("move-to-backup-page"),
                                    onClick: () => props.history.push(`/settings/backup`)
                                },
                            ]}
                        >{t("no-backup-notification")}</Modal>
                    )}/>
                </div>
            </HashRouter>
        );
    }
}

function mapStateToProps(state) {
    return {
        settings: state.settings,
        password: state.password,
        user: state.user,
        meta: state.meta,
        error: state.error
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps, null)(Root));