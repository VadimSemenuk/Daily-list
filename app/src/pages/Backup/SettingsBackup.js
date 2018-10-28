import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";
import moment from "moment";

import * as AppActions from '../../actions'; 

import './SettingsBackup.scss';

import Header from '../../components/Header/Header';
import {TriggerListItem} from "../../components/ListItem/ListItem";

import GoogleImg from '../../assets/img/google.svg';
import ExportImg from '../../assets/img/upload-to-cloud.svg';
import ImportImg from '../../assets/img/cloud-computing.svg';
import LogoutImg from '../../assets/img/logout.svg';

class SettingsBackup extends Component {
	constructor(props) {
        super(props);  
    }

    componentDidMount() {
        if (this.props.user.id) {
            this.props.getBackupFile(this.props.user);
        }
    }

    render () {
        let {t} = this.props;
        
        return (
            <div className="page-wrapper backup-page-wrapper">
                <Header title={t("backup")}/>
                <div className="scroll page-content padding">
                    {
                        !this.props.user.id &&
                        <div className="not-logined-wrapper">
                            <TriggerListItem 
                                text={t("how-it-works-btn")}
                                noBorder={true}    
                            >{t("how-it-works")}</TriggerListItem>
                            <button
                                className={`text block google-in img-text-button${this.props.loader ? " disabled" : ""}`} 
                                type="button"
                                onClick={this.props.googleSignIn}
                            ><img src={GoogleImg} />{t("google-sign-in")}</button>
                        </div>
                    }
                    {
                        this.props.user.id &&
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
                                ><img src={LogoutImg}/></button>
                            </div>
                            
                            <div className="backup-actions-buttons-wrapper">
                                <button 
                                    className={`text block img-text-button${this.props.loader ? " disabled" : ""}`} 
                                    type="button"
                                    onClick={() => this.props.uploadBackup(this.props.user)}
                                ><img src={ExportImg} />{t("create-backup")}</button>

                                <button 
                                    className={`text block img-text-button${(this.props.loader || !this.props.user.backupFile.id) ? " disabled" : ""}`} 
                                    type="button"
                                    onClick={() => this.props.restoreBackup(this.props.user)}
                                ><img src={ImportImg} />{t("restore-backup")}</button>
                            </div>
                            {
                                this.props.user.backupFile.id &&
                                <div className="backup-file-date">{t("copy")} {moment(this.props.user.backupFile.modifiedTime).format('LLL')}</div>
                            }
                        </div>
                    }
                    
                    <div className="local-backup-wrapper">
                        <button
                            className="text block" 
                            type="button"
                            onClick={this.props.restoreLocalBackup}
                        >{t("restore-local-backup")}</button>
                    </div>
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