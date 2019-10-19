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
import Trash from './pages/Trash/Trash';
import About from './pages/About/About';
import Loader from "./components/Loader/Loader";
import Modal from "./components/Modal/Modal";
import NotesSearch from "./pages/NotesSearch/NotesSearch";

class Root extends Component {
    componentDidMount() {
        this.setKeyboardEvents();
        Modal.init();
    }

    setKeyboardEvents() {
        window.addEventListener('keyboardDidShow', () => {
            let el = document.querySelector(".hide-with-active-keyboard");
            if (!el) {
                return;
            }
            el.classList.add("hidden");
            setTimeout(function() {
                document.activeElement.scrollIntoViewIfNeeded();
            }, 200);
        });
        window.addEventListener('keyboardDidHide', () => {
            let el = document.querySelector(".hide-with-active-keyboard");
            if (!el) {
                return;
            }
            el.classList.remove("hidden");
            setTimeout(function() {
                document.activeElement.scrollIntoViewIfNeeded();
            }, 200);           
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
                        path="/search"
                        component={NotesSearch}
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