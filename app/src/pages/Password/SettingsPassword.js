import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";
import md5 from "md5";

import * as AppActions from '../../actions'; 

import Header from "../../components/Header/Header";

import './SettingsPassword.scss';
import GoogleImg from "../../assets/img/google.svg";

class SettingsPassword extends Component {
	constructor(props) {
        super(props);
  
        this.state = {
            password0: '',
            password1: ''            
        }  
    }

    validatePassword() {
        if (this.state.password0 !== this.state.password1) {
            window.plugins.toast.showLongBottom(this.props.t("not-equal-passwords"));
        } else if (~this.state.password0.indexOf(' ')) {
            window.plugins.toast.showLongBottom(this.props.t("no-space-password"));
        } else if (this.state.password0.length < 4) {
            window.plugins.toast.showLongBottom(this.props.t("min-symbols-password"));
        } else if (!this.props.user) {
            window.plugins.toast.showLongBottom(this.props.t("reset-password-email-no-user"));
        } else {
            return true;
        }
        return false;
    }

    onPassSet = () => {
        if (this.validatePassword()) {
            this.props.setSetting('password', md5(this.state.password0));
            this.props.setSetting('passwordResetEmail', this.props.user.email);
            this.props.history.goBack();
        }
    }

    render () {
        let {t} = this.props;

        return (
            <div className="page-wrapper settings-password-page-wrapper">
                <Header title={t("password")} />
                <div className="scroll page-content padding">
                    <input
                        type="password"
                        placeholder={t("new-password")}
                        onChange={(e) => this.setState({password0: e.target.value})}
                    />
                    <input
                        type="password"
                        placeholder={t("repeat-password")}
                        onChange={(e) => this.setState({password1: e.target.value})}
                    />
                    <div className="reset-password-wrapper">
                        {
                            this.props.user &&
                            <div className="reset-password-email">{t("password-reset-email")}: <strong>{this.props.user.email}</strong></div>
                        }
                        {
                            !this.props.user &&
                            <div className="reset-password-email-no-user">
                                <span>{t("reset-password-email-no-user")}</span>
                                <button
                                    className="text block google-in img-text-button"
                                    type="button"
                                    onClick={this.props.googleSignIn}
                                ><img src={GoogleImg} alt="google sign in" />{t("google-sign-in")}</button>
                            </div>
                        }
                    </div>
                    <button
                        className="text block"
                        onClick={this.onPassSet}
                    >{t("save")}</button>       
                </div>
            </div>
        );
    }
}

function mapStateToProps(state, props) {
    return {
        settings: state.settings,
        user: state.user
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(SettingsPassword));