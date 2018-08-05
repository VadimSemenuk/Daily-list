import React, {Component} from 'react';
import {translate, Trans} from "react-i18next";

import './Troubleshooting.scss';

import Header from '../../components/Header/Header';
import {InsetListItem, TriggerListItem} from "../../components/ListItem/ListItem";

class Troubleshooting extends Component {
	constructor(props) {
        super(props);

        this.state = {
            issueVisible: false
        }
    }

    openSettings() {
        window.cordova.plugins.settings.open(["application_details", true])
    }

    setIssueVisible = (issueVisible) => {
        if (this.state.issueVisible === issueVisible) {
            issueVisible = false;
        }
        this.setState({
            issueVisible
        })
    }

    getPreviousVersion = () => {
        window.open('https://4pda.ru/forum/index.php?showtopic=800369', '_system', 'location=yes');        
    }

    render () {
        let {t} = this.props;

        return (
            <div className="page-wrapper troubleshooting-page-wrapper">
                <Header title={t("help")} />
                <div className="page-content scroll padding">
                    <InsetListItem 
                        text={t("previous-version")}
                        onClick={this.getPreviousVersion}
                    />
                    <TriggerListItem 
                        text={t("no-notification")}
                        onClick={() => this.setIssueVisible(1)}  
                        triggerValue={this.state.issueVisible === 1}
                    />
                    {
                        this.state.issueVisible === 1 &&
                        <div className="issue-wrapper">
                            {t("no-notification-a")}
                            <button 
                                onClick={this.openSettings}
                                className="text block"
                            >{t("move")}</button>
                            <img 
                                src={require("../../media/img/issues/issue1.0.jpg")}
                                alt="issue"
                            />
                            {t("no-notification-b")}
                            <img 
                                src={require("../../media/img/issues/issue1.1.jpg")}
                                alt="issue"                            
                            />
                            {t("no-notification-c")}                            
                            <img 
                                src={require("../../media/img/issues/issue1.2.jpg")}
                                alt="issue"                            
                            />
                        </div>
                    }
                </div>
            </div>
        );
    }
}

export default translate("translations")(Troubleshooting)