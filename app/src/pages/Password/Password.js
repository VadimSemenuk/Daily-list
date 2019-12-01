import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import * as AppActions from '../../actions'; 
import {getGreeting} from "../../utils/dayPart"
import {translate} from "react-i18next";
import md5 from "md5";

import './Password.scss';
import deviceService from "../../services/device.service";
import apiService from "../../services/api.service";
import {triggerLoader} from "../../actions";

class Password extends Component {
	constructor(props) {
        super(props);
  
        this.state = {
            password: ''
		}
	}

    validatePassword(value) {
        if (this.props.settings.password === md5(value)) {
            return true;
        }
        return false;
    }

    onPasswordInput = async (e) => {
	    let value = e.target.value;

        if (this.validatePassword(value)) {
            await this.props.setPasswordValid();
            this.props.history.replace("/");
        } else {
            this.setState({password: e.target.value});
        }
    }

    resetPassword = async () => {
	    if (!deviceService.hasNetworkConnection()) {
            window.plugins.toast.showLongBottom(this.props.t("internet-required"));
            return
        }

	    let emailTo = this.props.user ? this.props.user.email : this.props.settings.passwordResetEmail;

	    this.props.triggerLoader(true);
        let response = await apiService.post("local-password/reset", {lang: this.props.settings.lang, email: emailTo});
        this.props.triggerLoader(false);
        let newPassword = await response.text();
        this.props.setSetting('password', newPassword);
        window.plugins.toast.showLongBottom(this.props.t("password-has-been-reset").replace("{{email}}", emailTo));
    }

    render () {
        let {t} = this.props;

		return (
            <div className="page-wrapper">
                <div className="password-wrapper page-content">
                    <span className="greeting">{t(getGreeting())}</span>

                    <div className="password-input-wrapper">
                        <input
                            type="password"
                            placeholder={t("pass-in")}
                            onChange={this.onPasswordInput}
                        />
                    </div>

                    {
                        !this.props.settings.passwordResetEmail && !this.props.user &&
                        <span className="reset-password-notification">{t("reset-password-notification")}</span>
                    }
                    {
                        Boolean(this.props.settings.passwordResetEmail || this.props.user) &&
                        <button
                            className="text clear reset-password"
                            onClick={this.resetPassword}
                        >{t("reset-password")}</button>
                    }
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

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(Password));