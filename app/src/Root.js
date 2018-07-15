import React, { Component } from 'react';
import {HashRouter, Route, Redirect} from 'react-router-dom';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import * as AppActions from './actions'; 

import Header from './components/Header/Header';
import NotesList from './components/NotesList/NotesList';
import Add from './components/Add/Add';
import Password from './components/Password/Password';
import Settings from './components/Settings/Settings';
import SettingsTheme from './components/Settings/Theme/SettingsTheme';
import SettingsSort from './components/Settings/Sort/SettingsSort';
import SettingsPassword from './components/Settings/Password/SettingsPassword';
import SettingsBackup from './components/Settings/Backup/SettingsBackup';
import Troubleshooting from './components/Settings/Troubleshooting/Troubleshooting';
import About from './components/Settings/About/About';
import SynchronizationLoader from "./components/Elements/SynchronizationLoader/SynchronizationLoader";

class Root extends Component {
    constructor(props) {
        super(props);

        this.state = { }
    }

    onAddRequest = () => this.addRef.getWrappedInstance && this.addRef.getWrappedInstance().onSubmit();

    onCalendarRequest = () => this.noteListRef.getWrappedInstance && this.noteListRef.getWrappedInstance().triggerCalendar();    

    onDateSelect = (date) => this.noteListRef.getWrappedInstance && this.noteListRef.getWrappedInstance().setDate(date);        

    getDateIndex = () => {
        if (this.noteListRef.getWrappedInstance) {
            return this.noteListRef.getWrappedInstance().activePageIndex
        }
    }

    render() {
        return (
            <HashRouter>
                <div className="app-wrapper">
                    <Header 
                        onAddRequest={this.onAddRequest}
                        onCalendarRequest={this.onCalendarRequest}  
                        getDateIndex={this.getDateIndex}     
                        onDateSelect={this.onDateSelect}                 
                    />
                    <div className="app-content">
                        {
                            !this.props.password &&
                            <Redirect from="/" to="/password"/>           
                        }             
                        <Route 
                            path="/" 
                            render={(props) => (
                                <NotesList
                                    ref={(a) => this.noteListRef = a} 
                                    {...props} 
                                />
                            )}
                        />
                        <Route 
                            exact 
                            path="/add" 
                            render={(props) => (
                                <Add
                                    ref={(a) => this.addRef = a} 
                                    {...props} 
                                />
                            )}
                        />
                        <Route 
                            exact 
                            path="/edit" 
                            render={(props) => (
                                <Add
                                    ref={(a) => this.addRef = a} 
                                    {...props} 
                                />
                            )}
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
                            path="/settings/troubleshooting" 
                            component={Troubleshooting} 
                        />    
                        <Route 
                            exact 
                            path="/settings/about" 
                            component={About} 
                        />                                              
                    </div> 
                    <SynchronizationLoader />
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