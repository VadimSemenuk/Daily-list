import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";
import i18n from "i18next";
import moment from "moment";

import * as AppActions from '../../actions';

import Header from '../../components/Header/Header';
import {SwitchListItem, ButtonListItem, ModalListItem, ValueListItem} from "../../components/ListItem/ListItem";
import ColorPicker from '../../components/ColorPicker/ColorPicker';
import Radio from '../../components/Radio/Radio';

import themesService from '../../services/themes.service';
import settingsService from '../../services/settings.service'; 

import './SettingsTheme.scss';
import '../../components/ColorPicker/ColorPicker.scss';

let themes = themesService.getThemesList();
let fontSizeSettings = settingsService.getFontSizeSettings();
let languageSettings = settingsService.getLanguageSettings();

class SettingsTheme extends Component {
    constructor(props) {
        super(props);

        this.state = {
            langChanged: false
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

        themesService.applyTheme(theme);
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
        let activeLanguageSettings = languageSettings.find((a) => a.val === this.props.settings.lang);        

        return (
            <div className="page-wrapper theme-page-wrapper">
                <Header title={t("interface")} />
                <div className="scroll page-content padding">
                    <ModalListItem
                        text={t("theme")} 
                        style={{padding: "10px 0"}}
                        ValElement={() => (
                            <div className="color-item-wrapper">
                                <div className="color-item theme-header-background"></div>
                            </div>
                        )}
                        listItem={ButtonListItem}
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
                    </ModalListItem>

                    <ModalListItem
                        text={t("font-size")} 
                        value={this.props.settings.fontSize}
                        listItem={ValueListItem}
                    >
                        <div className="radio-group">
                            {
                                fontSizeSettings.map((setting, i) => (
                                    <Radio 
                                        key={i}
                                        name="font-size"
                                        checked={this.props.settings.fontSize === setting}
                                        value={setting}
                                        onChange={(value) => {
                                            this.props.setSetting('fontSize', +value)
                                            document.querySelector("body").style.fontSize = +value + "px";    
                                        }}
                                        text={setting}
                                    />
                                ))
                            }
                        </div>
                    </ModalListItem>
                    
                    <SwitchListItem 
                        text={t("fast-add")}  
                        checked={this.props.settings.fastAdd}
                        onChange={(e) => this.props.setSetting('fastAdd', e)}     
                    />

                    <SwitchListItem 
                        text={t("show-mini-calendar")}  
                        checked={this.props.settings.showMiniCalendar}
                        onChange={(e) => this.props.setSetting('showMiniCalendar', e)}     
                    />

                    <SwitchListItem 
                        text={t("show-notes-count")}  
                        checked={this.props.settings.calendarNotesCounter}
                        onChange={(e) => this.props.setSetting('calendarNotesCounter', e, "boolean", this.props.getFullCount)}     
                    />

                    <ModalListItem
                        text={t("language")} 
                        value={t(activeLanguageSettings.translateId)}
                        listItem={ValueListItem}
                        noExit={this.state.langChanged}
                    >
                        <div className="radio-group">
                            {
                                languageSettings.map((setting, i) => (
                                    <Radio 
                                        key={i}
                                        name="lang"
                                        checked={this.props.settings.lang === setting.val}
                                        value={setting.val}
                                        onChange={(value) => {
                                            this.props.setSetting('lang', value);
                                            i18n.changeLanguage(value);
                                            moment.locale(value);
                                            this.setState({
                                                langChanged: true
                                            })
                                        }}
                                        text={t(setting.translateId)}
                                    />
                                ))
                            }
                        </div>

                        {   this.state.langChanged && 
                            <div className="reload-app-note">
                                {t("reload-app-note")} 
                                <button 
                                    className="text block"
                                    onClick={() => window.location.reload(true)}
                                >{t("reload")}</button>
                            </div>
                        }
                    </ModalListItem>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        settings: state.settings,
        currentDate: state.date
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(SettingsTheme));