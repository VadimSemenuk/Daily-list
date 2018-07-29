import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import * as AppActions from '../../actions'; 

import Switch from '../../components/Switch/Switch';
import Header from '../../components/Header/Header';
import { SwitchListItem, InsetListItem } from "../../components/ListItem/ListItem";

import './Settings.scss';

class Settings extends Component {
	render () {	
		return (
            <div className="page-wrapper">
                <Header />
                <div className="settings-page-wrapper scroll page-content padding">
                    <SwitchListItem 
                        text="Включить уведомдение по умолчанию"
                        checked={this.props.settings.defaultNotification}
                        onChange={(e) => this.props.setSetting('defaultNotification', +e)}
                    />
                    <InsetListItem 
                        text="Отображение"
                        onClick={() => this.props.history.push(`${this.props.match.url}/sort`)}  
                    />
                    <InsetListItem 
                        text="Интерфейс"
                        onClick={() => this.props.history.push(`${this.props.match.url}/theme`)} 
                    />
                    <InsetListItem 
                        text="Синхронизация данных"
                        onClick={() => this.props.history.push(`${this.props.match.url}/backup`)}
                    />
                    <InsetListItem 
                        text={this.props.settings.password === null ? 'Добавить пароль' : 'Удалить пароль'}
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
                    />
                    <InsetListItem 
                        text="Устранение неисправностей"
                        onClick={() => this.props.history.push(`${this.props.match.url}/troubleshooting`)}
                    />
                    <InsetListItem 
                        text="О программе"
                        onClick={() => this.props.history.push(`${this.props.match.url}/about`)}
                    />
                </div>
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