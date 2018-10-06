import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import * as AppActions from '../../actions'; 

import './SettingsBackup.scss';

import Header from '../../components/Header/Header';

import GoogleImg from '../../assets/img/google.svg';
import ExportImg from '../../assets/img/export.svg';
import ImportImg from '../../assets/img/import.svg';


class SettingsBackup extends Component {
	constructor(props) {
        super(props);  
    }

    render () {
        return (
            <div className="page-wrapper backup-page-wrapper">
                <Header />
                <div className="scroll page-content padding">
                    {   
                        !this.props.user.id &&
                        <div className="not-logined-wrapper">
                            <div className="backup-info">Данные будут привязаны к учетной записи. При входе в учетную запись с различных устройств данные будут синхронизированы.</div>

                            <button 
                                className="text block google-in img-text-button" 
                                type="button"
                                onClick={this.props.googleSignIn}
                            ><img src={GoogleImg} />Войти с помощью Google</button>
                        </div>
                    }
                    {
                        this.props.user.id &&
                        <div className="logined-wrapper">
                            <div className="profile-wrapper">
                                <div className="profile-img-wrapper clickable"><img src={this.props.user.picture} /></div>
                                <div className="profile-data-wrapper">
                                    <div className="profile-info-wrapper">
                                        <div className="name">{this.props.user.name}</div>
                                        <div className="email">{this.props.user.email}</div>
                                    </div>

                                    <button 
                                        className="text log-out" 
                                        type="button"
                                        onClick={this.props.googleSignIn}
                                    >Выйти</button>
                                </div>
                            </div>

                            <button 
                                className="text block img-text-button" 
                                type="button"
                                onClick={this.props.googleSignIn}
                            ><img src={ExportImg} />Создать резервную копию</button>
                            <button 
                                className="text block img-text-button" 
                                type="button"
                                onClick={this.props.googleSignIn}
                            ><img src={ImportImg} />Загрузить резервную копию</button>
                        </div>
                    }
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        settings: state.settings,
        currentDate: state.date,
        user: state.user      
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsBackup);