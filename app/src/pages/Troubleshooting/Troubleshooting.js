import React, {Component} from 'react';

import './Troubleshooting.scss';

import arrowRight from '../../media/img/right-grey.svg';

import Header from '../../components/Header/Header';
import { InsetListItem, TriggerListItem } from "../../components/ListItem/ListItem";

export default class Troubleshooting extends Component {
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
        return (
            <div className="page-wrapper troubleshooting-page-wrapper">
                <Header />
                <div className="page-content scroll padding">
                    <InsetListItem 
                        text="Предыдущая версия"
                        onClick={this.getPreviousVersion}  
                    />
                    <TriggerListItem 
                        text="Не приходят уведомления"
                        onClick={() => this.setIssueVisible(1)}  
                        triggerValue={this.state.issueVisible === 1}
                    />
                    {
                        this.state.issueVisible === 1 &&
                        <div className="issue-wrapper">
                            Перейдите в настройки приложения
                            <button 
                                onClick={this.openSettings}
                                className="text block"
                            >Перейти</button>
                            <img 
                                src={require("../../media/img/issues/issue1.0.jpg")}
                                alt="issue"
                            />
                            Затем перейдите к настройкам разрешений<br/>
                            <img 
                                src={require("../../media/img/issues/issue1.1.jpg")}
                                alt="issue"                            
                            />
                            Для разрешения "Запуск в фоне" (название может отличаться) установите значение "Разрешить"
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