import React, {Component} from 'react';

import './Troubleshooting.scss';

import arrowRight from '../../media/img/right-grey.svg';

import Header from '../../components/Header/Header';

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
            <div className="page-wrapper">
                <Header />
                <div className="troubleshooting-page-wrapper settings-page-wrapper scroll">
                    <div className="troubleshooting-info">
                        При возникновении неполадок в работе, преложениями по улучшению можно обратиться на email: vadim54787@gmail.com.
                    </div>

                    <button 
                        className="setting-item touchable"
                        onClick={this.getPreviousVersion}
                    >
                        <span className="setting-item-text">Предыдущая версия</span>
                        <img 
                            className="setting-item-img"
                            src={arrowRight} 
                            alt="in"
                        /> 
                    </button>
                    <button 
                        className={`setting-item touchable${this.state.issueVisible === 1 ? " active" : ""}`}
                        onClick={() => this.setIssueVisible(1)}
                    >
                        <span className="setting-item-text">Не появляются уведомления</span>
                        <img 
                            className="setting-item-img"
                            src={arrowRight} 
                            alt="in"
                        /> 
                    </button>
                    {
                        this.state.issueVisible === 1 &&
                        <div className="issue-wrapper">
                            Перейдите в настройки приложения
                            <button 
                                onClick={this.openSettings}
                                className="text underlined to-settings"
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