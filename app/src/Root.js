import React, { Component } from 'react';
import {HashRouter, Route, Redirect} from 'react-router-dom';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";

import * as AppActions from './actions'; 

import NotesList from './pages/NotesList/NotesList';
import Add from './pages/Add/Add';
import Password from './pages/Password/Password';
import Settings from './pages/Settings/Settings';
import SettingsTheme from './pages/Theme/SettingsTheme';
import SettingsSort from './pages/Sort/SettingsSort';
import SettingsPassword from './pages/Password/SettingsPassword';
import SettingsBackup from './pages/Backup/SettingsBackup';
import About from './pages/About/About';
import Loader from "./components/Loader/Loader";
import Modal from "./components/Modal/Modal";

import authService from "./services/auth.service";

import GoogleImg from './assets/img/google.svg';

class Root extends Component {
    constructor(props) {
        super(props);

        this.state = {
            nextVersionMigrationModal: false
        }
    }

    componentDidMount() {
        this.nextVersionMigration();

        this.setKeyoardEvents();

        Modal.init();    
    }

    setKeyoardEvents() {
        window.addEventListener('keyboardDidShow', () => {
            document.querySelector(".hide-with-active-keyboard").classList.add("hidden");
            setTimeout(function() {
                document.activeElement.scrollIntoViewIfNeeded();
            }, 100);
        });
        window.addEventListener('keyboardDidHide', () => {
            document.querySelector(".hide-with-active-keyboard").classList.remove("hidden"); 
            setTimeout(function() {
                document.activeElement.scrollIntoViewIfNeeded();
            }, 100);           
        });
    }
       
    async nextVersionMigration() {
        if (!this.props.meta.nextVersionMigrated) {
            if (this.props.user.id || 1) {
                await authService.googleSignOut();
                this.setState({
                    nextVersionMigrationModal: true
                })
            } else {
                this.props.setNextVersionMigrationState(true);
            }
        }
    }

    discardNextVersionMigration = () => {
        this.props.setNextVersionMigrationState(true);
        this.closeDialog();
    }

    closeDialog = () => {
        this.setState({
            nextVersionMigrationModal: false
        });
    }

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
                    <Loader />

                    <Modal 
                        isOpen={this.state.nextVersionMigrationModal} 
                        onRequestClose={this.closeDialog}
                    >
                        <h3>{t("re-enter-request-title")}</h3>
                        <p>{t("re-enter-request-description")}</p>
                        <button
                            className={`text block google-in img-text-button${this.props.loader ? " disabled" : ""}`} 
                            type="button"
                            onClick={this.props.googleSignIn}
                        ><img src={GoogleImg} />{t("google-sign-in")}</button>

                        <div className="action-buttons-wrapper">
                            <button className="text clear" onClick={this.discardNextVersionMigration}>{t("re-enter-discard-button")}</button>
                            <button className="text clear" onClick={this.closeDialog}>{t("re-enter-later-button")}</button>
                        </div>
                    </Modal>
                </div>
            </HashRouter>
        );
    }
}

function mapStateToProps(state, props) {
    return {
        settings: state.settings,
        password: state.password,
        user: state.user,
        meta: state.meta     
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps, null)(Root));