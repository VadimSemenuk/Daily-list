import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import * as AppActions from '../../actions'; 

import authService from "../../services/auth.service";

import './SettingsBackup.scss';

import Header from '../../components/Header/Header';

class SettingsBackup extends Component {
	constructor(props) {
        super(props);
  
        this.cleanSignUp = {
            name: "",
            email: "",
            password: ""
        }
        this.cleanSignIn = {
            email: "",
            password: ""
        }
        this.userInfo = authService.getUserInfoToken();

        this.state = {
            signUp: {
                ...this.cleanSignUp
            },
            signIn: {
                ...this.cleanSignIn
            },
            activeForm: 1,
            userInfo: {
                ...this.userInfo
            }
        }  
    }

    handleSignUpInputChange = (event) => {
        let target = event.target;
        let value = target.type === 'checkbox' ? target.checked : target.value;
        let name = target.name;     

        this.setState({
            signUp: {
                ...this.state.signUp,
                [name]: value
            }
        });
    }

    handleSignInInputChange = (event) => {
        let target = event.target;
        let value = target.type === 'checkbox' ? target.checked : target.value;
        let name = target.name;     

        this.setState({
            signIn: {
                ...this.state.signIn,
                [name]: value
            }
        });
    }

    onSignUp = async (e) => {
        e.preventDefault();
        
        let user = await authService.signUp(this.state.signUp);
        this.setState({
            signUp: {
                ...this.cleanSignUp,
                userInfo: user
            }
        })

        // TODO: check for notes with undefined userId
    }

    onSignIn = async (e) => {
        e.preventDefault();

        let user = await authService.signIn(this.state.signIn);
        this.setState({
            signIn: {
                ...this.cleanSignIn,
                userInfo: user
            }
        })
        
        // TODO: check for notes with undefined userId
    }

    switchForms = () => {
        let nextActiveForm = this.state.activeForm === 1 ? 0 : 1;

        this.setState({
            activeForm: nextActiveForm
        })
        this.resetForm();
    }

    resetForm() {
        this.setState({
            signUp: {
                ...this.cleanSignUp
            },
            signIn: {
                ...this.cleanSignIn
            }
        })
    }

    render () {
        return (
            <div className="page-wrapper">
                <Header />
                <div className="settings-backup-wrapper settings-page-wrapper scroll page-content">
                    <div className="backup-info">Данные будут привязаны к учетной записи. При входе в учетную запись с различных устройств данные будут синхронизированы.</div>
                
                    {
                        this.state.activeForm === 0 &&
                        <form 
                            className="sign-up-form"
                            onSubmit={this.onSignUp}
                        >
                            <span className="form-name">Регистрация</span>
                            <input 
                                type="text" 
                                placeholder="Имя" 
                                name="name"
                                value={this.state.signUp.name} 
                                onChange={this.handleSignUpInputChange} 
                            />
                            <input 
                                type="email" 
                                placeholder="Email" 
                                name="email"                        
                                value={this.state.signUp.email} 
                                onChange={this.handleSignUpInputChange} 
                            />
                            <input 
                                type="password" 
                                placeholder="Пароль"
                                name="password"                          
                                value={this.state.signUp.password} 
                                onChange={this.handleSignUpInputChange} 
                            />
                            <button 
                                type="submit" 
                                className="text"
                            >Регистрация</button>
                            <button 
                                className="text clear"
                                type="button"                            
                                onClick={this.switchForms}
                            >Войти</button>                    
                        </form>
                    }

                    {
                        this.state.activeForm === 1 &&
                        <form 
                            className="sign-in-form"
                            onSubmit={this.onSignIn}
                        >
                            <span className="form-name">Войти</span>
                            <input 
                                type="email" 
                                placeholder="Email" 
                                name="email"                        
                                value={this.state.signIn.email} 
                                onChange={this.handleSignInInputChange} 
                            />
                            <input 
                                type="password" 
                                placeholder="Пароль"
                                name="password"                          
                                value={this.state.signIn.password} 
                                onChange={this.handleSignInInputChange} 
                            />
                            <button 
                                type="submit" 
                                className="text"
                            >Войти</button>
                            <button 
                                className="text clear" 
                                type="button"
                                onClick={this.switchForms}
                            >Регистрация</button>                    
                        </form>
                    }

                    {
                        this.state.activeForm === null &&
                        <div className="user-info-wrapper">
                            <div>{}</div>
                        </div>
                    }
                </div>
            </div>
        );
    }
}

function mapStateToProps(state, props) {
    return {
        settings: state.settings,
        currentDate: state.date        
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsBackup);