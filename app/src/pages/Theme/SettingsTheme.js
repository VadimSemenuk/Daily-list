import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import * as AppActions from '../../actions'; 

import Header from '../../components/Header/Header';
import { SwitchListItem, ListItem, SelectListItem } from "../../components/ListItem/ListItem";
import Modal from "../../components/Modal/Modal";
import ColorPicker from '../../components/ColorPicker/ColorPicker';

import themesService from '../../services/themes.service';

import './SettingsTheme.scss';
import '../../components/ColorPicker/ColorPicker.scss';

class SettingsTheme extends Component {
	constructor(props) {
        super(props);

        this.state = {

        }

        this.themes = themesService.getThemesList();
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
                <div className="scroll page-content padding">
                    <ListItem 
                        onClick={() => this.setState({ themeModal: true })}
                        text="Тема"
                        style={{padding: "10px 0"}}
                        ValElement={() => (
                            <div className="color-item-wrapper">
                                <div 
                                    className="color-item"
                                    style={{backgroundColor: this.props.settings.theme.header}}
                                ></div>
                            </div>
                        )}
                    />

                    <Modal 
                        isOpen={this.state.themeModal}
                        onRequestClose={() => this.setState({themeModal: false})}
                    >
                        <SwitchListItem 
                            text="Случайная тема"  
                            checked={this.props.settings.theme === -1}
                            onChange={(e) => this.onThemeSelect(-1)}     
                        />
                        <ColorPicker
                            colors={this.themes}
                            field="header"
                            value={this.props.settings.theme}
                            onSelect={(event) => this.onThemeSelect(event.color.id)}
                            disabled={this.props.settings.theme === -1}
                        />
                    </Modal>

                    <SelectListItem
                        text="Размер шрифта"
                        value={this.props.settings.fontSize}
                        onSelect={(value) => {
                            this.props.setSetting('fontSize', +value)
                            document.querySelector("body").style.fontSize = +value + "px";    
                        }}
                    />
                    <SwitchListItem 
                         text="Поле быстрого добавления"  
                         checked={this.props.settings.fastAdd}
                        onChange={(e) => this.props.setSetting('fastAdd', +e)}     
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

export default connect(mapStateToProps, mapDispatchToProps)(SettingsTheme);