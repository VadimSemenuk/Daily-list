import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import * as AppActions from '../../actions'; 

import authService from "../../services/auth.service";

import './SettingsBackup.scss';

import Header from '../../components/Header/Header';

import GoogleImg from '../../assets/img/google.svg';

import config from "../../config/config";

class SettingsBackup extends Component {
	constructor(props) {
        super(props);
  
        this.userInfo = authService.getUserInfoToken();

        this.state = {

        }  
    }

    googleSignIn = () => {
        authService.googleSignIn()
    }

    render () {
        return (
            <div className="page-wrapper backup-page-wrapper">
                <Header />
                <div className="scroll page-content padding">
                    <div className="backup-info">Данные будут привязаны к учетной записи. При входе в учетную запись с различных устройств данные будут синхронизированы.</div>

                    <button 
                        className="text block google-in img-text-button" 
                        type="button"
                        onClick={this.googleSignIn}
                    ><img src={GoogleImg} />Войти с помощью Google</button>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        settings: state.settings,
        currentDate: state.date        
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsBackup);