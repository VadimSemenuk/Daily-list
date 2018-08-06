import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import moment from "moment";
import {translate, Trans} from "react-i18next";

import * as AppActions from '../../actions'; 

import Radio from '../../components/Radio/Radio';
import Header from '../../components/Header/Header';
import {InsetListItem, SwitchListItem, ModalListItem, ValueListItem} from "../../components/ListItem/ListItem";
import Modal from "../../components/Modal/Modal";

import './SettingsSort.scss';

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

        return (
            <div className="page-wrapper">
                <Header title={t("view")} />
                <div className="scroll page-content padding">
                    <ModalListItem
                        text={t("sort")} 
                        value={"value"}
                        listItem={ValueListItem}
                    >
                        <div className="radio-group">
                            <Radio 
                                name="sort-type"
                                checked={this.props.settings.sort.type === 0}
                                value={0}
                                onChange={(e, text) => this.props.setSetting("sort", Object.assign(this.props.settings.sort, {type: +e}))}
                                text={t("time-sort")}
                            />
                            <Radio
                                name="sort-type"
                                checked={this.props.settings.sort.type === 1}
                                value={1}                
                                onChange={(e) => this.props.setSetting("sort", Object.assign(this.props.settings.sort, {type: +e}))}
                                text={t("time-add-sort")}
                            />
                        </div>
                    </ModalListItem>

                    <ModalListItem
                        text={t("view-direction")} 
                        value={"value"}
                        listItem={ValueListItem}
                    >
                        <div className="radio-group">
                            <Radio 
                                name="sort-direction"
                                checked={this.props.settings.sort.direction === 0}
                                value={0}
                                onChange={(e) => this.props.setSetting("sort", Object.assign(this.props.settings.sort, {direction: +e}))}
                                text={t("view-direction-asc")}
                            />
                            <Radio
                                name="sort-direction"
                                checked={this.props.settings.sort.direction === 1}
                                value={1}                
                                onChange={(e) => this.props.setSetting("sort", Object.assign(this.props.settings.sort, {direction: +e}))}
                                text={t("view-direction-desc")}
                            />
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