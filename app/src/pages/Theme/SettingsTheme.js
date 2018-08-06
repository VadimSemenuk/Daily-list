import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate, Trans} from "react-i18next";

import * as AppActions from '../../actions'; 

import Header from '../../components/Header/Header';
import {SwitchListItem, ButtonListItem, SelectListItem} from "../../components/ListItem/ListItem";
import Modal from "../../components/Modal/Modal";
import ColorPicker from '../../components/ColorPicker/ColorPicker';

import themesService from '../../services/themes.service';

import './SettingsTheme.scss';
import '../../components/ColorPicker/ColorPicker.scss';

let themes = themesService.getThemesList();

class SettingsTheme extends Component {
    constructor(props) {
        super(props);

        this.state = {
            themeModal: false
        }
    }

    onThemeSelect = (id) => {
        let theme = themesService.getThemeById(id);
        if (window.cordova && window.cordova.platformId === 'android') {
            window.StatusBar.backgroundColorByHexString(theme.statusBar);
        }

        if (id === -1) {
            this.props.setSetting('theme', Object.assign({}, theme, { id: -1 }));
        } else {
            this.props.setSetting('theme', theme)
        }
    }

    onRandomThemeModeTrigger = (e) => {
        if (e) {
            this.onThemeSelect(-1);
        } else {
            this.onThemeSelect(this.props.settings.theme.realId);
        }
    }

    render () {
        let {t} = this.props;

        return (
            <div className="page-wrapper theme-page-wrapper">
                <Header title={t("interface")} />
                <div className="scroll page-content padding">
                    <ButtonListItem 
                        onClick={() => this.setState({themeModal: true})}
                        text={t("theme")}
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
                            text={t("random-theme")}  
                            checked={this.props.settings.theme.id === -1}
                            onChange={this.onRandomThemeModeTrigger}     
                        />
                        <ColorPicker
                            colors={themes}
                            field="header"
                            value={this.props.settings.theme}
                            onSelect={(event) => this.onThemeSelect(event.color.id)}
                            disabled={this.props.settings.theme.id === -1}
                        />
                    </Modal>

                    <SelectListItem
                        text={t("font-size")}
                        value={this.props.settings.fontSize}
                        onSelect={(value) => {
                            this.props.setSetting('fontSize', +value)
                            document.querySelector("body").style.fontSize = +value + "px";    
                        }}
                    />
                    <SwitchListItem 
                        text={t("fast-add")}  
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

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(SettingsTheme));