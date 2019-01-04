import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import * as AppActions from '../../actions'; 
import {getGreeting} from "../../utils/dayPart"
import {translate} from "react-i18next";

import arrowRight from '../../assets/img/right-grey.svg';

import './Password.scss';

class Password extends Component {
	constructor(props) {
        super(props);
  
        this.state = {
            password: ''
		}
	}

    validatePassword() {
        if (this.props.settings.password === this.state.password) {
            return true
        } else {
            window.plugins.toast.showLongBottom(this.props.t("invalid-password"))
        }
    }

    in = async () => {
        if (this.validatePassword()) {
            await this.props.setPasswordValid();
            this.props.history.replace("/");
        };
    }

    onKeyPress = (e) => e.key === "Enter" && this.in()

    render () {
        let {t} = this.props;

		return (
            <div class="page-wrapper">
                <div className="password-wrapper">
                    <span className="greeting">{t(getGreeting())}</span>

                    <div className="password-input-wrapper">
                        <input
                            type="password"
                            placeholder={t("pass-in")}
                            onChange={(e) => this.setState({password: e.target.value})}
                            onKeyPress={this.onKeyPress}
                        /> 
                        <button onClick={this.in}>
                            <img 
                                className="in"
                                src={arrowRight} 
                                alt="in"
                            />
                        </button>      
                    </div> 
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

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(Password));