import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";
import moment from "moment";

import * as AppActions from '../../actions'; 

import './SettingsBackup.scss';

import Header from '../../components/Header/Header';
import {TriggerListItem, SwitchListItem} from "../../components/ListItem/ListItem";

import GoogleImg from '../../assets/img/google.svg';
import ExportImg from '../../assets/img/upload-to-cloud.svg';
import ImportImg from '../../assets/img/cloud-computing.svg';
import LogoutImg from '../../assets/img/logout.svg';

class SettingsBackup extends Component {
    componentDidMount() {
        if (this.props.user.id !== undefined) {
            this.props.updateLastBackupTime();
        }
    }

    render () {
        let {t} = this.props;
        
        return (
            <div className="page-wrapper backup-page-wrapper">
                <Header title={t("backup")}/>
                <div className="scroll page-content padding">
                    {
                        this.props.user.id === undefined &&
                        <div className="not-logined-wrapper">
                            <button
                                className="text block google-in img-text-button"
                                type="button"
                                onClick={this.props.googleSignIn}
                            ><img src={GoogleImg} alt="google sign in" />{t("google-sign-in")}</button>
                        </div>
                    }
                    {
                        this.props.user.id !== undefined &&
                        <div className="logined-wrapper">
                            <div className="profile-wrapper">
                                <div className="profile-img-wrapper clickable" style={{backgroundImage: `url(${this.props.user.picture})`}}></div>
                                <div className="profile-data-wrapper">
                                    <div className="name">{this.props.user.name}</div>
                                    <div className="email">{this.props.user.email}</div>
                                </div>
                                <button 
                                    className="log-out" 
                                    type="button"
                                    onClick={this.props.googleSignOut}
                                ><img src={LogoutImg} alt="logout"/></button>
                            </div>
                            
                            <div className="backup-settings-wrapper">
                                <SwitchListItem 
                                    text={t("auto-backup")}
                                    checked={this.props.user.settings ? this.props.user.settings.autoBackup : false}
                                    onChange={(e) => this.props.setToken({...this.props.user, settings: { ...this.props.user.settings, autoBackup: e }})}
                                />
                            </div>
                            
                            <div className="backup-actions-buttons-wrapper">
                                <button 
                                    className="text block img-text-button"
                                    type="button"
                                    onClick={() => this.props.uploadBatchBackup()}
                                ><img src={ExportImg} alt="export"/>{t("create-backup")}</button>

                                <button 
                                    className={`text block img-text-button${!this.props.user.backup.lastBackupTime ? " disabled" : ""}`}
                                    type="button"
                                    onClick={() => this.props.restoreBackup()}
                                ><img src={ImportImg} alt="import" />{t("restore-backup")}</button>
                            </div>
                            {
                                this.props.user.backup.lastBackupTime &&
                                <div className="backup-file-date">{t("copy")} {moment(this.props.user.backup.lastBackupTime).format('LLL')}</div>
                            }
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
        user: state.user,
        loader: state.loader 
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(SettingsBackup));