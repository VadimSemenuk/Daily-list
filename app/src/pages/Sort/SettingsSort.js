import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";

import * as AppActions from '../../actions'; 

import settingsService from '../../services/settings.service'; 

import Radio from '../../components/Radio/Radio';
import Header from '../../components/Header/Header';
import {SwitchListItem, ModalListItem, ValueListItem} from "../../components/ListItem/ListItem";

import './SettingsSort.scss';

let sortTypeSettings = settingsService.getSortTypeSettings();
let sortDirectionSettings = settingsService.getSortDirectionSettings();
let notesShowIntervalSettings = settingsService.getNotesShowIntervalSettings();

class SettingsSort extends Component {
    constructor(props) {
        super(props);

        let sortTypeSelectedValue = sortTypeSettings.find((a) => a.val === this.props.settings.sort.type).val;
        let sortDirectionSelectedValue = sortDirectionSettings.find((a) => a.val === this.props.settings.sort.direction).val;

        this.state = {
            sortTypeSelectedValue,
            sortDirectionSelectedValue
        }
    }

    render() {
        let {t} = this.props;
        let activeSortType = sortTypeSettings.find((a) => a.val === this.props.settings.sort.type);
        let activeSortDirection = sortDirectionSettings.find((a) => a.val === this.props.settings.sort.direction);    
        let activeNotesShowInterval = notesShowIntervalSettings.find((a) => a.val === this.props.settings.notesShowInterval);                

        return (
            <div className="page-wrapper">
                <Header title={t("view")} />
                <div className="scroll page-content padding">
                    <ModalListItem
                        text={t("sort")} 
                        value={t(activeSortType.translateId)}
                        listItem={ValueListItem}
                        actionItems={[
                            {
                                text: t("cancel"),
                                onClick: () => this.setState({sortTypeSelectedValue: activeSortType.val})
                            },
                            {
                                text: t("ok"),
                                onClick: () => this.props.setSetting("sort", Object.assign(this.props.settings.sort, {type: this.state.sortTypeSelectedValue}), this.props.renderNotes)
                            }
                        ]}
                    >
                        <div className="radio-group">
                            {
                                sortTypeSettings.map((setting, i) => (
                                    <Radio 
                                        key={i}
                                        name="sort-type"
                                        checked={this.state.sortTypeSelectedValue === setting.val}
                                        value={setting.val}
                                        onChange={(e) => this.setState({sortTypeSelectedValue: +e})}
                                        text={t(setting.translateId)}
                                    />
                                ))
                            }
                        </div>
                    </ModalListItem>

                    <ModalListItem
                        text={t("view-direction")} 
                        value={t(activeSortDirection.translateId)}
                        listItem={ValueListItem}
                        actionItems={[
                            {
                                text: t("cancel"),
                                onClick: () => this.setState({sortDirectionSelectedValue: activeSortDirection.val})
                            },
                            {
                                text: t("ok"),
                                onClick: () => this.props.setSetting("sort", Object.assign(this.props.settings.sort, {direction: this.state.sortDirectionSelectedValue}), this.props.renderNotes)
                            }
                        ]}
                    >
                        <div className="radio-group">
                            {
                                sortDirectionSettings.map((setting, i) => (
                                    <Radio
                                        key={i}
                                        name="sort-direction"
                                        checked={this.state.sortDirectionSelectedValue === setting.val}
                                        value={setting.val}
                                        onChange={(e) => this.setState({sortDirectionSelectedValue: +e})}
                                        text={t(setting.translateId)}
                                    />
                                ))
                            }
                        </div>
                    </ModalListItem>

                    <SwitchListItem 
                        text={t("fin-sort")}  
                        checked={this.props.settings.sort.finSort}
                        onChange={(e) => this.props.setSetting("sort", Object.assign(this.props.settings.sort, {finSort: e}), this.props.renderNotes)}     
                    />   

                    {
                        false &&
                        <ModalListItem
                            text={t("notes-show-interval")} 
                            value={t(activeNotesShowInterval.translateId)}
                            listItem={ValueListItem}
                        >
                            <div className="radio-group">
                                {
                                    notesShowIntervalSettings.map((setting, i) => (
                                        <Radio
                                            key={i}
                                            name="sort-direction"
                                            checked={this.props.settings.notesShowInterval === setting.val}
                                            value={setting.val}
                                            onChange={(e) => this.props.setSetting("notesShowInterval", e)}
                                            text={t(setting.translateId)}
                                        />
                                    ))
                                }
                            </div>
                        </ModalListItem>   
                    }      
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

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(SettingsSort));