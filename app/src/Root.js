import React, { Component } from 'react';
import {HashRouter, Route, Redirect} from 'react-router-dom';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

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

class Root extends Component {
    constructor(props) {
        super(props);

        this.state = { }
    }

    componentDidMount() {
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
       
    render() {
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
                </div>
            </HashRouter>
        );
    }
}

function mapStateToProps(state, props) {
    return {
        settings: state.settings,
        password: state.password
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, null)(Root);