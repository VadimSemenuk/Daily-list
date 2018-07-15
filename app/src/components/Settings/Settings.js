import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import * as AppActions from '../../actions'; 

import Switch from '../Elements/Switch/Switch';

import './Settings.scss';

import arrowRight from '../../media/img/right-grey.svg';

class Settings extends Component {
	constructor(props) {
        super(props);
  
        this.state = { }
	}

	render () {	
		return (
            <div className="settings-page-wrapper scroll">
                <div className="setting-item">
                    <span className="setting-item-text">Включить уведомдение по умолчанию</span>
                    <Switch 
                        checked={this.props.settings.defaultNotification}
                        onChange={(e) => this.props.setSetting('defaultNotification', +e)}
                    />
                </div>
                <button 
                    className="setting-item touchable"
                    onClick={() => this.props.history.push(`${this.props.match.url}/sort`)}                                
                >
                    <span className="setting-item-text">Отображение</span>
                    <img 
                        className="setting-item-img"
                        src={arrowRight} 
                        alt="in"
                    /> 
                </button>
                <button
                    className="setting-item touchable"
                    onClick={() => this.props.history.push(`${this.props.match.url}/theme`)}
                >
                    <span className="setting-item-text">Интерфейс</span>
                    <img 
                        className="setting-item-img"
                        src={arrowRight} 
                        alt="in"                        
                    /> 
                </button>
                <button 
                    className="setting-item touchable"
                    onClick={() => this.props.history.push(`${this.props.match.url}/backup`)}
                >
                    <span className="setting-item-text">Синхронизация данных</span>
                    <img 
                        className="setting-item-img"
                        src={arrowRight} 
                        alt="in"                        
                    /> 
                </button>
                <button 
                    className="setting-item touchable"
                    onClick={() => {
                        if (this.props.settings.password === null) {
                            this.props.history.push({
                                pathname: `${this.props.match.url}/password`,
                                state: { 
                                    onValueSet: (v) => this.props.setSetting('password', v)
                                }
                            })
                        } else {
                            this.props.setSetting('password', null);
                        }
                    }}
                >
                    <span className="setting-item-text">{this.props.settings.password === null ? 'Добавить пароль' : 'Удалить пароль'}</span>
                    <img 
                        className="setting-item-img"
                        src={arrowRight} 
                        alt="in"
                    /> 
                </button>
                <button 
                    className="setting-item touchable"
                    onClick={() => this.props.history.push(`${this.props.match.url}/troubleshooting`)}
                >
                    <span className="setting-item-text">Устранение неисправностей</span>
                    <img 
                        className="setting-item-img"
                        src={arrowRight} 
                        alt="in"
                    /> 
                </button>
                <button 
                    className="setting-item touchable"
                    onClick={() => this.props.history.push(`${this.props.match.url}/about`)}
                >
                    <span className="setting-item-text">О программе</span>
                    <img 
                        className="setting-item-img"
                        src={arrowRight} 
                        alt="in"
                    /> 
                </button>
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

export default connect(mapStateToProps, mapDispatchToProps)(Settings);