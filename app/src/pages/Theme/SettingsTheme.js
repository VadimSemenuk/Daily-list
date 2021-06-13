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
import {CalendarNotesCounterMode} from "../../constants";

let themes = themesService.getThemesList();
let fontSizeSettings = settingsService.getFontSizeSettings();
let languageSettings = settingsService.getLanguageSettings();

class SettingsTheme extends Component {
    constructor(props) {
        super(props);

        this.state = {
            themeSelectValue: this.props.settings.theme,
            fontSizeSelectedValue: this.props.settings.fontSize,
            languageSelectedValue: this.props.settings.lang,
            calendarNotesCounterMode: this.props.settings.calendarNotesCounterMode
        }
    }

    onThemeSelect = (id) => {
        let theme = themesService.getThemeById(id);
        this.setState({themeSelectValue: theme});
    };

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
                            this.state.themeSelectValue.id === -2 ?
                                <span className="list-item-value">{t("night-mode")}</span> :
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
                                    themesService.applyTheme(this.state.themeSelectValue);
                                }
                            }
                        ]}
                    >
                        <SwitchListItem
                            text={t("night-mode")}
                            checked={this.state.themeSelectValue.id === -2}
                            onChange={(event) => this.onThemeSelect(event ? -2 : 0)}
                        />
                        <SwitchListItem 
                            text={t("random-theme")}  
                            checked={this.state.themeSelectValue.id === -1}
                            disabled={this.state.themeSelectValue.id === -2}
                            onChange={(event) => this.onThemeSelect(event ? -1 : this.state.themeSelectValue.realId)}
                        />
                        <ColorPicker
                            colors={themes}
                            field="header"
                            value={this.state.themeSelectValue}
                            disabled={this.state.themeSelectValue.id === -1 || this.state.themeSelectValue.id === -2}
                            onSelect={(event) => this.onThemeSelect(event.color.id)}
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

                    <ModalListItem
                        text={t("notes-count")}
                        value={t(CalendarNotesCounterMode.toTextId(this.props.settings.calendarNotesCounterMode))}
                        listItem={ValueListItem}
                        actionItems={[
                            {
                                text: t("cancel"),
                                onClick: () => this.setState({calendarNotesCounterMode: this.props.settings.calendarNotesCounterMode})
                            },
                            {
                                text: t("ok"),
                                onClick: () => {
                                    this.props.setSetting('calendarNotesCounterMode', this.state.calendarNotesCounterMode);
                                }
                            }
                        ]}
                    >
                        <div className="radio-group">
                            {
                                CalendarNotesCounterMode.toList().map((setting, i) => (
                                    <Radio
                                        key={i}
                                        name="lang"
                                        checked={this.state.calendarNotesCounterMode === setting.value}
                                        value={setting.value}
                                        onChange={(value) => this.setState({calendarNotesCounterMode: Number(value)})}
                                        text={t(setting.textId)}
                                    />
                                ))
                            }
                        </div>
                    </ModalListItem>

                    <SwitchListItem
                        text={t("minimize-notes")}
                        checked={this.props.settings.minimizeNotes}
                        onChange={(e) => this.props.setSetting('minimizeNotes', e, this.props.renderNotes)}
                    />

                    <SwitchListItem
                        text={t("move-control-panels-down")}
                        checked={this.props.settings.invertHeaderPosition}
                        onChange={(e) => this.props.setSetting('invertHeaderPosition', e)}
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