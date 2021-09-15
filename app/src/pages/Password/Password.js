import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import * as AppActions from '../../actions'; 
import {getGreeting} from "../../utils/dayPart"
import {generatePassword} from "../../utils/passwordGenerator"
import {translate} from "react-i18next";
import md5 from "md5";

import './Password.scss';
import deviceService from "../../services/device.service";
import apiService from "../../services/api.service";

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
            await this.props.setPasswordCheckState();
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

	    this.props.triggerLoader(true);

        let nextPassword = generatePassword();
        let emailTo = this.props.user ? this.props.user.email : this.props.settings.passwordResetEmail;

        let result = await apiService.sendMail({
            from: this.props.t("app-name"),
            to: emailTo,
            subject: this.props.t("password-reset-email-subject"),
            text: this.props.t("password-reset-email-content") + nextPassword
        })
            .then((res) => {
                if (res.status === 200) {
                    return res.json();
                }
            });

        if (result) {
            this.props.setSetting({password: md5(nextPassword)});
        }

        this.props.triggerLoader(false);

        window.cordova && window.plugins.toast.show(this.props.t("password-has-been-reset").replace("{email}", emailTo), 10000, 'center');
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
                            className="text clear reset-password f-600"
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