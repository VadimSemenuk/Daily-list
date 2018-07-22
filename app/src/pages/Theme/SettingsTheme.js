import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import * as AppActions from '../../actions'; 

import Switch from '../../components/Switch/Switch';
import Header from '../../components/Header/Header';

import themesService from '../../services/themes.service';

import './SettingsTheme.scss';

class SettingsTheme extends Component {
	constructor(props) {
        super(props);

        this.state = {
            colors: themesService.getThemesList()
        }
    }

    onThemeSelect = (id) => {
        let theme = themesService.getThemeByIndex(id);
        if (window.cordova && window.cordova.platformId === 'android') {
            window.StatusBar.backgroundColorByHexString(theme.statusBar);
        }

        if (id === -1) {
            this.props.setSetting('theme', Object.assign({}, theme, { id: -1 }));
        } else {
            this.props.setSetting('theme', theme)
        }
    }

    render () {
        return (
            <div className="page-wrapper">
                <Header />
                <div className="settings-visual-wrapper settings-page-wrapper scroll page-content">
                    <div className="settings-visual-item setting-item">
                        <span className="settings-visual-item-title">Тема:</span>
                        <div className="color-picker-list-wrapper">
                            <button 
                                className={`theme-item-wrapper theme-item-random ${this.props.settings.theme.id === -1 ? "active" : ""}`} 
                                onClick={() => this.onThemeSelect(-1)}
                            >
                                <div 
                                    className="theme-item"
                                >
                                    <img 
                                        src={require("../../media/img/shuffle.svg")}
                                        alt="random"
                                    />
                                </div>
                            </button>
                            {
                                this.state.colors.map((a, i) => (
                                    <button 
                                        key={i} 
                                        className={`color-item-wrapper ${this.props.settings.theme.id === a.id ? "active" : ""}`} 
                                        onClick={() => this.onThemeSelect(a.id)}
                                    >
                                        <div 
                                            className="color-item"
                                            style={{backgroundColor: a.header}}
                                        ></div>
                                    </button>
                                ))
                            }
                        </div>
                    </div>
                    <div className="settings-visual-item setting-item">
                        <span className="settings-visual-item-title setting-item-text">Размер шрифта:</span>
                        <div className="font-size">
                            <select 
                                value={this.props.settings.fontSize}
                                onChange={(e) => {
                                    this.props.setSetting('fontSize', +e.target.value)
                                    document.querySelector("body").style.fontSize = +e.target.value + "px";    
                                }}
                            >
                                <option value="12">12</option>
                                <option value="13">13</option>
                                <option value="14">14</option>
                                <option value="15">15</option>
                                <option value="16">16</option>
                                <option value="17">17</option>
                                <option value="18">18</option>                            
                            </select>
                        </div>
                    </div>
                    <div className="setting-item">
                        <span className="setting-item-text">Поле быстрого добавления</span>
                        <Switch 
                            checked={this.props.settings.fastAdd}
                            onChange={(e) => this.props.setSetting('fastAdd', +e)}
                        />
                    </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(SettingsTheme);