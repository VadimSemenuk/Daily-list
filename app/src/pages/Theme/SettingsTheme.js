import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";

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
            themeSelectValue: this.props.settings.theme,
            fontSizeSelectedValue: this.props.settings.fontSize,
            languageSelectedValue: this.props.settings.lang
        }
    }

    onThemeSelect = (id) => {
        let theme = themesService.getThemeById(id);
        this.setState({themeSelectValue: theme});
    }

    applyTheme(theme) {
        if (window.cordova) {
            window.StatusBar.backgroundColorByHexString(theme.statusBar);
        }
        themesService.applyTheme(theme);
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
                        actionItems={[
                            {
                                text: t("cancel"),
                                onClick: () => this.setState({themeSelectValue: this.props.settings.theme})
                            },
                            {
                                text: t("ok"),
                                onClick: () => {
                                    this.props.setSetting('theme', this.state.themeSelectValue);
                                    this.applyTheme(this.state.themeSelectValue);
                                }
                            }
                        ]}
                    >
                        <SwitchListItem 
                            text={t("random-theme")}  
                            checked={this.state.themeSelectValue.id === -1}
                            onChange={(event) => this.onThemeSelect(event ? -1 : this.props.settings.theme.realId)}     
                        />
                        <ColorPicker
                            colors={themes}
                            field="header"
                            value={this.state.themeSelectValue}
                            onSelect={(event) => this.onThemeSelect(event.color.id)}
                            disabled={this.state.themeSelectValue.id === -1}
                        />
                    </ModalListItem>

                    <ModalListItem
                        text={t("font-size")} 
                        value={this.props.settings.fontSize}
                        listItem={ValueListItem}
                        actionItems={[
                            {
                                text: t("cancel"),
                                onClick: () => this.setState({fontSizeSelectedValue: this.props.settings.fontSize})
                            },
                            {
                                text: t("ok"),
                                onClick: () => {
                                    this.props.setSetting('fontSize', this.state.fontSizeSelectedValue);
                                    document.querySelector("body").style.fontSize = this.state.fontSizeSelectedValue + "px"; 
                                }
                            }
                        ]}
                    >
                        <div className="radio-group">
                            {
                                fontSizeSettings.map((setting, i) => (
                                    <Radio 
                                        key={i}
                                        name="font-size"
                                        checked={this.state.fontSizeSelectedValue === setting}
                                        value={setting}
                                        onChange={(value) => this.setState({fontSizeSelectedValue: +value})}
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
                        onChange={(e) => this.props.setSetting('calendarNotesCounter', e, this.props.getFullCount)}     
                    />

                    <ModalListItem
                        text={t("language")} 
                        value={t(activeLanguageSettings.translateId)}
                        listItem={ValueListItem}
                        actionItems={[
                            {
                                text: t("cancel"),
                                onClick: () => this.setState({languageSelectedValue: this.props.settings.lang})
                            },
                            {
                                text: t("ok"),
                                onClick: () => {
                                    this.props.setSetting('lang', this.state.languageSelectedValue);
                                    window.location.reload(true);
                                }
                            }
                        ]}
                    >
                        <div className="radio-group">
                            {
                                languageSettings.map((setting, i) => (
                                    <Radio 
                                        key={i}
                                        name="lang"
                                        checked={this.state.languageSelectedValue === setting.val}
                                        value={setting.val}
                                        onChange={(value) => this.setState({languageSelectedValue: value})}
                                        text={t(setting.translateId)}
                                    />
                                ))
                            }
                        </div>
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