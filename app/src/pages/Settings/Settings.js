import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";

import * as AppActions from '../../actions'; 

import Header from '../../components/Header/Header';
import {InsetListItem} from "../../components/ListItem/ListItem";

import './Settings.scss';

class Settings extends Component {
	render () {	
        let {t} = this.props;

		return (
            <div className="page-wrapper">
                <Header title={t("settings")} />
                <div className="scroll page-content padding">
                    <InsetListItem
                        text={t("note-settings")}
                        onClick={() => this.props.history.push(`${this.props.match.url}/notes-settings`)}
                    />
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
                            onClick={() => this.props.setSetting({password: null})}
                        />
                    }
                </div>
            </div>
		);
	}
}

function mapStateToProps(state) {
    return {
        settings: state.settings
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(Settings));