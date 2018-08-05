import React, { Component } from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import moment from "moment";
import {translate, Trans} from "react-i18next";

import * as AppActions from '../../actions'; 

import Radio from '../../components/Radio/Radio';
import Header from '../../components/Header/Header';
import {InsetListItem, SwitchListItem} from "../../components/ListItem/ListItem";
import Modal from "../../components/Modal/Modal";

import './SettingsSort.scss';

class SettingsSort extends Component {
    constructor(props) {
        super(props);

        this.state = {
            sortModal: false,
            directionModal: false,
            finsModal: false,

            sortVal: this.props.settings.sort.type,
            directionVal: this.props.settings.sort.direction,
        }
    }

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
                    <InsetListItem 
                        text={t("sort")}
                        onClick={() => this.setState({sortModal: true})}
                    />
                    <Modal 
                        isOpen={this.state.sortModal}
                        onRequestClose={() => this.setState({sortModal: false})}
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
                    </Modal>

                    <InsetListItem 
                        text={t("view-direction")}
                        onClick={() => this.setState({directionModal: true})}
                    />
                    <Modal 
                        isOpen={this.state.directionModal}
                        onRequestClose={() => this.setState({directionModal: false})}
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
                    </Modal>

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