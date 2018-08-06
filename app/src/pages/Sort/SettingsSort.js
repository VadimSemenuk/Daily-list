import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import moment from "moment";
import {translate, Trans} from "react-i18next";

import * as AppActions from '../../actions'; 

import settingsService from '../../services/settings.service'; 

import Radio from '../../components/Radio/Radio';
import Header from '../../components/Header/Header';
import {InsetListItem, SwitchListItem, ModalListItem, ValueListItem} from "../../components/ListItem/ListItem";
import Modal from "../../components/Modal/Modal";

import './SettingsSort.scss';

let sortTypeSettings = settingsService.getSortTypeSettings();
let sortDirectionSettings = settingsService.getSortDirectionSettings();

class SettingsSort extends Component {
    componentWillUnmount() {
        this.props.getNotesByDates(
            [
                moment(this.props.currentDate).add(-1, "day"),
                moment(this.props.currentDate).startOf("day"),
                moment(this.props.currentDate).add(1, "day")
            ]
        ); 
    }

    render() {
        let {t} = this.props;
        let activeSortType = sortTypeSettings.find((a) => a.val === this.props.settings.sort.type);
        let activeSortDirection = sortDirectionSettings.find((a) => a.val === this.props.settings.sort.direction);        

        return (
            <div className="page-wrapper">
                <Header title={t("view")} />
                <div className="scroll page-content padding">
                    <ModalListItem
                        text={t("sort")} 
                        value={t(activeSortType.translateId)}
                        listItem={ValueListItem}
                    >
                        <div className="radio-group">
                            {
                                sortTypeSettings.map((setting, i) => (
                                    <Radio 
                                        key={i}
                                        name="sort-type"
                                        checked={this.props.settings.sort.type === setting.val}
                                        value={setting.val}
                                        onChange={(e, text) => this.props.setSetting("sort", Object.assign(this.props.settings.sort, {type: +e}))}
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
                    >
                        <div className="radio-group">
                            {
                                sortDirectionSettings.map((setting, i) => (
                                    <Radio
                                        key={i}
                                        name="sort-direction"
                                        checked={this.props.settings.sort.direction === setting.val}
                                        value={setting.val}
                                        onChange={(e) => this.props.setSetting("sort", Object.assign(this.props.settings.sort, {direction: +e}))}
                                        text={t(setting.translateId)}
                                    />
                                ))
                            }
                        </div>
                    </ModalListItem>

                    <SwitchListItem 
                        text={t("fin-sort")}  
                        checked={this.props.settings.sort.finSort}
                        onChange={(e) => this.props.setSetting("sort", Object.assign(this.props.settings.sort, {finSort: e}))}     
                    />            
                </div>
            </div>
        );
    }

}    

function mapStateToProps(state, props) {
    return {
        settings: state.settings,
        currentDate: state.date        
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(SettingsSort));