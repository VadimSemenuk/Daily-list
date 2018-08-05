import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate, Trans} from "react-i18next";

import * as AppActions from '../../actions'; 

import Header from "../../components/Header/Header";

import './SettingsPassword.scss';

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
        } else {
            return true;
        }
        return false;
    }

    onPassSet = () => {
        if (this.validatePassword()) {
            this.props.setSetting('password', this.state.password0);
            this.props.history.goBack();
        };
    }

    render () {
        let {t} = this.props;

        return (
            <div className="page-wrapper">
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
        settings: state.settings
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(SettingsPassword));