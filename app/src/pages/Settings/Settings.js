import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";
import moment from "moment";

import * as AppActions from '../../actions'; 

import Header from '../../components/Header/Header';
import {InsetListItem, ButtonListItem} from "../../components/ListItem/ListItem";

import {NotesScreenMode} from "../../constants";

import './Settings.scss';
import externalLink from "../../assets/img/external-link.svg";

class Settings extends Component {
	render () {	
        let {t} = this.props;

		return (
            <div className="page-wrapper">
                <Header title={t("settings")} />
                <div className="scroll page-content padding">
                    <InsetListItem 
                        text={t("view")}
                        onClick={() => this.props.history.push(`${this.props.match.url}/sort`)}  
                    />
                    <InsetListItem 
                        text={t("interface")}
                        onClick={() => this.props.history.push(`${this.props.match.url}/theme`)} 
                    />
                    {
                        this.props.settings.password === null &&
                        <InsetListItem
                            text={t("add-pass")}
                            onClick={() => this.props.history.push(`${this.props.match.url}/password`)}
                        />
                    }
                    {
                        this.props.settings.password !== null &&
                        <InsetListItem
                            text={t("remove-pass")}
                            onClick={() => this.props.setSetting('password', null)}
                        />
                    }
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