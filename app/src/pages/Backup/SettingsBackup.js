import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";

import * as AppActions from '../../actions'; 

import './SettingsBackup.scss';

import Header from '../../components/Header/Header';

import GoogleImg from '../../assets/img/google.svg';
import ExportImg from '../../assets/img/upload-to-cloud.svg';
import ImportImg from '../../assets/img/cloud-computing.svg';
import LogoutImg from '../../assets/img/logout.svg';
import Modal from "../../components/Modal/Modal";
import {ButtonListItem} from "../../components/ListItem/ListItem";

class SettingsBackup extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isSelectFileToRestoreModalVisible: false,
        }
    }

    componentDidMount() {
        if (this.props.user) {
            this.props.updateGDBackupFiles();
        }
        this.props.updateLocalBackupFiles();
    }

    restoreBackup = () => {
        this.setState({
            isSelectFileToRestoreModalVisible: true
        });
    }

    render () {
        let {t} = this.props;

        return (
            <div className="page-wrapper backup-page-wrapper">
                <Header title={t("backup")}/>
                <div className="scroll page-content padding">
                    {
                        !this.props.user &&
                        <div className="not-logined-wrapper">
                            <button
                                className="text block google-in img-text-button"
                                type="button"
                                onClick={this.props.googleSignIn}
                            ><img src={GoogleImg} alt="google sign in" />{t("google-sign-in")}</button>
                        </div>
                    }
                    {
                        this.props.user &&
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
                            
                            <div className="backup-actions-buttons-wrapper">
                                <button 
                                    className="text block img-text-button"
                                    type="button"
                                    onClick={() => this.props.uploadGDBackup("user")}
                                ><img src={ExportImg} alt="export"/>{t("create-backup")}</button>

                                {   this.props.user.gdBackup.backupFiles.length > 0 &&
                                    <button
                                        className={`text block img-text-button`}
                                        type="button"
                                        onClick={this.restoreBackup}
                                    ><img src={ImportImg} alt="import" />{t("restore-backup")}</button>
                                }
                            </div>
                            {
                                (this.props.user && this.props.user.gdBackup.backupFiles.length > 0) &&
                                <div className="backup-files">
                                    {t("available-copies")}:
                                    <ul>
                                        {
                                            [...this.props.user.gdBackup.backupFiles]
                                                .sort((a, b) => {
                                                    if (a.name === "DailyListSqliteDBFile") {
                                                        return -1;
                                                    }
                                                    if (b.name === "DailyListSqliteDBFile") {
                                                        return 1;
                                                    }
                                                    return -(a.modifiedTime.diff(b.modifiedTime))
                                                })
                                                .map((f, i) => {
                                                    return <li key={i}>
                                                        {
                                                            f.name === "DailyListSqliteDBFile_auto" &&
                                                            <span>{t('copy-auto-created-google-drive')} {f.properties.manufacturer} {f.properties.model}, </span>
                                                        }
                                                        <strong>{f.modifiedTime.format('LLL')}</strong>
                                                    </li>
                                                })
                                        }
                                    </ul>
                                </div>
                            }
                        </div>
                    }

                    {
                        <div className="local-baclup-files-wrapper">
                            {
                                (this.props.backup.local.length > 0 && !this.props.user) &&
                                <button
                                    className={`text block img-text-button`}
                                    type="button"
                                    onClick={this.restoreBackup}
                                ><img src={ImportImg} alt="import" />{t("restore-backup")}</button>
                            }

                            {
                                (this.props.backup.local.length > 0) &&
                                <div className="backup-files">
                                    {t("available-local-copies")}:
                                    <ul>
                                        {
                                            [...this.props.backup.local]
                                                .sort((a, b) => {
                                                    return -(a.modifiedTime.diff(b.modifiedTime))
                                                })
                                                .map((f, i) => {
                                                    return <li key={i}>
                                                        <span>{t('copy-auto-created-local')} </span>
                                                        <strong>{f.modifiedTime.format('LLL')}</strong>
                                                    </li>
                                                })
                                        }
                                    </ul>
                                </div>
                            }
                        </div>
                    }

                    <Modal
                        isOpen={this.state.isSelectFileToRestoreModalVisible}
                        onRequestClose={() => this.setState({isSelectFileToRestoreModalVisible: false})}
                        actionItems={[
                            {
                                text: t("close")
                            }
                        ]}
                    >
                        {
                            this.props.user && [...this.props.user.gdBackup.backupFiles]
                                .sort((a, b) => {
                                    if (a.name === "DailyListSqliteDBFile") {
                                        return -1;
                                    }
                                    if (b.name === "DailyListSqliteDBFile") {
                                        return 1;
                                    }
                                    return -(a.modifiedTime.diff(b.modifiedTime))
                                })
                                .map((f, i) => {
                                    return <ButtonListItem
                                        key={i}
                                        className="no-border"
                                        onClick={() => this.props.restoreGDBackup(f)}
                                    >
                                        {
                                            f.name === "DailyListSqliteDBFile_auto" &&
                                            <span>{t('copy-auto-created-google-drive')} {f.properties.manufacturer} {f.properties.model}, </span>
                                        }
                                        <strong>{f.modifiedTime.format('LLL')}</strong>
                                    </ButtonListItem>
                                })
                        }

                        {
                            [...this.props.backup.local]
                                .sort((a, b) => {
                                    return -(a.modifiedTime.diff(b.modifiedTime))
                                })
                                .map((f, i) => {
                                    return <ButtonListItem
                                        key={i}
                                        className="no-border"
                                        onClick={() => this.props.restoreLocalBackup(f)}
                                    >
                                        <span>{t('copy-auto-created-local')} </span>
                                        <strong>{f.modifiedTime.format('LLL')}</strong>
                                    </ButtonListItem>
                                })
                        }
                    </Modal>
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
        loader: state.loader,
        backup: state.backup
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(SettingsBackup));