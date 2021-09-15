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
import {IconListItem, SwitchListItem} from "../../components/ListItem/ListItem";
// import config from "../../config/config";

class SettingsBackup extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isRestoreBackupConfirmationModalVisible: false,
            backupToRestore: null
        }
    }

    componentDidMount() {
        if (this.props.user) {
            this.props.updateGDBackupFiles();
        }
    }

    showRestoreBackupConfirmation = (backup) => {
        this.setState({
            isRestoreBackupConfirmationModalVisible: true,
            backupToRestore: backup
        });
    }

    // signIn = () => {
    //     window.plugins.googleplus.login(
    //         {
    //             scopes: 'https://www.googleapis.com/auth/drive.appfolder',
    //             webClientId: config.google.webClientId,
    //             offline: true
    //         },
    //     );
    // }
    //
    // silentSignIn = () => {
    //     window.plugins.googleplus.login(
    //         {
    //             scopes: 'https://www.googleapis.com/auth/drive.appfolder',
    //             webClientId: config.google.webClientId,
    //             offline: true
    //         },
    //     );
    // }
    //
    // signOut = () => {
    //     window.plugins.googleplus.logout();
    // }
    //
    // disconnect = () => {
    //     window.plugins.googleplus.disconnect();
    // }
    //
    // isAvailable = () => {
    //     window.plugins.googleplus.isAvailable();
    // }

    render () {
        let {t} = this.props;

        return (
            <div className="page-wrapper backup-page-wrapper">
                <Header title={t("backup")}/>
                <div className="scroll page-content padding">

                    {/*<button*/}
                    {/*    className="text block google-in img-text-button"*/}
                    {/*    type="button"*/}
                    {/*    onClick={this.signIn}*/}
                    {/*><img src={GoogleImg} alt="google sign in" />sign in</button>*/}

                    {/*<button*/}
                    {/*    className="text block google-in img-text-button"*/}
                    {/*    type="button"*/}
                    {/*    onClick={this.silentSignIn}*/}
                    {/*><img src={GoogleImg} alt="google sign in" />silent sign in</button>*/}

                    {/*<button*/}
                    {/*    className="text block google-in img-text-button"*/}
                    {/*    type="button"*/}
                    {/*    onClick={this.signOut}*/}
                    {/*><img src={GoogleImg} alt="google sign in" />sign out</button>*/}

                    {/*<button*/}
                    {/*    className="text block google-in img-text-button"*/}
                    {/*    type="button"*/}
                    {/*    onClick={this.disconnect}*/}
                    {/*><img src={GoogleImg} alt="google sign in" />disconnect</button>*/}

                    {/*<button*/}
                    {/*    className="text block google-in img-text-button"*/}
                    {/*    type="button"*/}
                    {/*    onClick={this.disconnect}*/}
                    {/*><img src={GoogleImg} alt="google sign in" />is available</button>*/}

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

                            <div className="profile-settings-wrapper">
                                <SwitchListItem
                                    text={t("auto-backup")}
                                    checked={this.props.user.settings.autoBackup}
                                    onChange={(value) => this.props.updateUserSettings({autoBackup: value})}
                                />
                            </div>

                            <div className="backup-actions-buttons-wrapper">
                                <button 
                                    className="text block img-text-button"
                                    type="button"
                                    onClick={() => this.props.uploadGDBackup("user")}
                                ><img src={ExportImg} alt="export"/>{t("create-backup")}</button>
                            </div>
                            {
                                (this.props.user && this.props.user.gdBackup.backupFiles.length > 0) &&
                                <div className="backup-files-wrapper">
                                    <span className="backup-files-title">{t("available-copies")}:</span>
                                    <div className="backup-files">
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
                                                    return (
                                                        <IconListItem
                                                            key={i}
                                                            textElement={
                                                                <div className="backup-file">
                                                                    {
                                                                        f.name === "DailyListSqliteDBFile_auto" &&
                                                                        <span>{t('copy-auto-created-google-drive')} {f.properties.manufacturer} {f.properties.model}<br/></span>
                                                                    }
                                                                    <strong>{f.modifiedTime.format('LLL')}</strong>
                                                                </div>
                                                            }
                                                            icon={ImportImg}
                                                            onClick={() => this.showRestoreBackupConfirmation(f)}
                                                        />
                                                    )
                                                })
                                        }
                                    </div>
                                </div>
                            }
                        </div>
                    }

                    <Modal
                        isOpen={this.state.isRestoreBackupConfirmationModalVisible}
                        className="restore-backup-confirmation-modal"
                        onRequestClose={() => this.setState({isRestoreBackupConfirmationModalVisible: false})}
                        actionItems={[
                            {
                                text: t("close")
                            },
                            {
                                text: t("ok"),
                                onClick: () => {
                                    this.props.restoreGDBackup(this.state.backupToRestore)
                                }
                            }
                        ]}
                    >
                        {
                            this.state.backupToRestore &&
                            <React.Fragment>
                                <div className="backup-file">
                                    {
                                        this.state.backupToRestore.name === "DailyListSqliteDBFile_auto" &&
                                        <span>{t('copy-auto-created-google-drive')} {this.state.backupToRestore.properties.manufacturer} {this.state.backupToRestore.properties.model}<br/></span>
                                    }
                                    <strong>{this.state.backupToRestore.modifiedTime.format('LLL')}</strong>
                                </div>
                                <span className="restore-backup-confirmation">{t("restore-backup-confirmation")}</span>
                            </React.Fragment>
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