import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";

import * as AppActions from '../../actions'; 

import Header from '../../components/Header/Header';
import TrashListItem from './TrashListItem/TrashListItem';

import './Trash.scss';

class Trash extends Component {
    async componentDidMount() {
        this.props.getDeletedNotes();
    }

    onItemActionsWindowRequest = () => {}

    onImageShowRequest = () => {}

    onItemDynaicFieldChange = () => {}

    onRestore = (note) => this.props.restoreNote(note);

    render() {
        let {t} = this.props;

        return (
            <div className="page-wrapper">
                <Header title={t("trash")} />
                <div className="page-content trash-list-page-content">
                    <div className="scroll items-wrapper">
                        {
                            this.props.trash.map((a) => (
                                <TrashListItem 
                                    key={a.key}
                                    itemData={a}
                                    onShowImage={this.onImageShowRequest}
                                    onDynaicFieldChange={this.onItemDynaicFieldChange}
                                    onItemActionsWindowRequest={this.onItemActionsWindowRequest}
                                    onRestore={this.onRestore}
                                /> 
                            ))
                        }
                    </div>
                    {
                        this.props.trash.length !== 0 &&
                        <div className="clean-trash-button-wrapper">
                            <button 
                                className="text block"
                                onClick={this.props.cleanDeletedNotes}
                            >{t("clean-trash")}</button>
                        </div>
                    }
                </div>
            </div>
        );
    }

}    

function mapStateToProps(state) {
    return {
        settings: state.settings,
        trash: state.trash
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(Trash));