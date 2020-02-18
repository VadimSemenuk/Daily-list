import React, { Component } from 'react';
import {HashRouter, Route, Redirect} from 'react-router-dom';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import * as AppActions from './actions';

import timezoneService from './services/timezone.service';
import noteService from './services/notes.service';
import deviceService from './services/device.service';

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
import Radio from "./components/Radio/Radio";

let timezones = [{
    name: '-12',
    val: -12
}, {
    name: '-11',
    val: -11
}, {
    name: '-10',
    val: -10
}, {
    name: '-9.30',
    val: -9.50
}, {
    name: '-9',
    val: -9
}, {
    name: '-8',
    val: -8
}, {
    name: '-7',
    val: -7
}, {
    name: '-6',
    val: -6
}, {
    name: '-5',
    val: -5
}, {
    name: '-4',
    val: -4
}, {
    name: '-3.30',
    val: -3.50
}, {
    name: '-3',
    val: -3
}, {
    name: '-2',
    val: -2
}, {
    name: '-1',
    val: -1
}, {
    name: '0',
    val: 0
}, {
    name: '+1',
    val: 1
}, {
    name: '+2',
    val: 2
}, {
    name: '+3',
    val: 3
}, {
    name: '+3.30',
    val: 3.50
}, {
    name: '+4',
    val: 4
}, {
    name: '+4.30',
    val: 4.50
}, {
    name: '+5',
    val: 5
}, {
    name: '+5.30',
    val: 5.50
}, {
    name: '+5.45',
    val: 5.75
}, {
    name: '+6',
    val: 6
}, {
    name: '+6.30',
    val: 6.50
}, {
    name: '+7',
    val: 7
}, {
    name: '+8',
    val: 8
}, {
    name: '+8.45',
    val: 8.75
}, {
    name: '+9',
    val: 9
}, {
    name: '+9.30',
    val: 9.50
}, {
    name: '+10',
    val: 10
}, {
    name: '+10.30',
    val: 10.50
}, {
    name: '+11',
    val: 11
}, {
    name: '+12',
    val: 12
}, {
    name: '+12.45',
    val: 12.75
}, {
    name: '+13',
    val: 13
}, {
    name: '+14',
    val: 14
}];

class Root extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isTimezoneDialogOpen: false,
            selectedTimezone: null
        }
    }

    async componentDidMount() {
        this.setKeyoardEvents();

        Modal.init();

        let isPreviousTimezoneProcessed = await deviceService.isPreviousTimezoneProcessed();
        if (!isPreviousTimezoneProcessed) {
            let hasNotes = await noteService.hasNotes();
            if (hasNotes) {
                this.setState({
                    isTimezoneDialogOpen: true
                })
            }
        }
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

    closeDialog = () => {
        this.setState({
            isTimezoneDialogOpen: false
        })
    }

    onTimezoneSelect = (timezone) => {
        this.closeDialog();
        this.setState({
            selectedTimezone: timezone
        })

        timezoneService.processDefaultTimezone(timezone * 60);
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

                    <Modal
                        isOpen={this.state.isTimezoneDialogOpen}
                        onRequestClose={this.closeDialog}
                    >
                        Выберете предыдущий часовой пояс
                        <div className="radio-group">
                            {
                                timezones.map((timezone, i) => (
                                    <Radio
                                        key={i}
                                        name="timezone"
                                        checked={this.state.selectedTimezone === timezone.val}
                                        value={timezone.val}
                                        onChange={(e) => this.onTimezoneSelect(e)}
                                        text={'UTC ' + timezone.name}
                                    />
                                ))
                            }
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
        password: state.password
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, null)(Root);