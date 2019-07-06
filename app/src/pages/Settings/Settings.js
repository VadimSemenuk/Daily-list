import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";
import moment from "moment";

import * as AppActions from '../../actions'; 

import Header from '../../components/Header/Header';
import {InsetListItem, ButtonListItem} from "../../components/ListItem/ListItem";

import './Settings.scss';
import externalLink from "../../assets/img/external-link.svg";

class Settings extends Component {
	render () {	
        let {t} = this.props;

		return (
            <div className="page-wrapper">
                <Header title={t("settings")} />
                <div className="scroll page-content padding">
                    <ButtonListItem
                        text={t(this.props.settings.notesScreenMode === 1 ? "show-notes-screen" : "show-daily-notes-screen")}
                        img={externalLink}
                        onClick={() => {
                            let nextNotesScreenMode = this.props.settings.notesScreenMode === 1 ? 2 : 1;
                            this.props.setSetting("notesScreenMode", nextNotesScreenMode);
                            setTimeout(() => {
                                let msCurDate = moment().startOf("day");
                                let msPrevDate = moment(msCurDate).add(-1, "day");
                                let msNextDate = moment(msCurDate).add(1, "day");
                                this.props.setDatesAndUpdateNotes([msPrevDate, msCurDate, msNextDate], 1, nextNotesScreenMode);
                                this.props.history.replace("/");
                            }, 100)
                        }}
                    />
                    <InsetListItem 
                        text={t("view")}
                        onClick={() => this.props.history.push(`${this.props.match.url}/sort`)}  
                    />
                    <InsetListItem 
                        text={t("interface")}
                        onClick={() => this.props.history.push(`${this.props.match.url}/theme`)} 
                    />
                    <InsetListItem 
                        text={t("backup")}
                        onClick={() => this.props.history.push(`${this.props.match.url}/backup`)}
                    />
                    <InsetListItem 
                        text={this.props.settings.password === null ? t("add-pass") : t("remove-pass")}
                        onClick={() => {
                            if (this.props.settings.password === null) {
                                this.props.history.push(`${this.props.match.url}/password`);
                            } else {
                                this.props.setSetting('password', null);
                            }
                        }}
                    />
                    <InsetListItem 
                        text={t("trash")}
                        onClick={() => this.props.history.push(`/trash`)}
                    />
                    <InsetListItem 
                        text={t("about")}
                        onClick={() => this.props.history.push(`${this.props.match.url}/about`)}
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

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(Settings));