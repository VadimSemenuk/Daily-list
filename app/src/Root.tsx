import * as React from "react";
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

type RootProps = {
    password: any;
}

class Root extends React.Component<RootProps, any> {
    constructor(props: any) {
        super(props);

        this.state = { }
    }

    private addRef: any;
    private noteListRef: any;

    public componentDidMount() {
        this.setKeyoardEvents();
    }

    private setKeyoardEvents() {
        window.addEventListener('keyboardDidShow', () => {
            (document.querySelector(".hide-with-active-keyboard") as HTMLElement).classList.add("hidden");
        });
        window.addEventListener('keyboardDidHide', () => {
            (document.querySelector(".hide-with-active-keyboard") as HTMLElement).classList.remove("hidden");            
        });
    }

    public onAddRequest = () => this.addRef.getWrappedInstance && this.addRef.getWrappedInstance().onSubmit();

    public onCalendarRequest = () => this.noteListRef.getWrappedInstance && this.noteListRef.getWrappedInstance().triggerCalendar();    

    public onDateSelect = (date: any) => this.noteListRef.getWrappedInstance && this.noteListRef.getWrappedInstance().setDate(date);        

    public getDateIndex = () => {
        if (this.noteListRef.getWrappedInstance) {
            return this.noteListRef.getWrappedInstance().activePageIndex
        }
    }

    public render() {
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

function mapStateToProps(state: any, props: any) {
    return {
        settings: state.settings,
        password: state.password
    }
}

function mapDispatchToProps(dispatch: any) {
    return bindActionCreators(AppActions, dispatch);
}

// export default connect(mapStateToProps, mapDispatchToProps, null)(Root);
export default connect(mapStateToProps, mapDispatchToProps)(Root);