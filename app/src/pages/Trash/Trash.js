import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";

import * as AppActions from '../../actions'; 

import Header from '../../components/Header/Header';
import TrashListItem from './TrashListItem/TrashListItem';

import notesService from '../../services/notes.service';

import './Trash.scss';

class Trash extends Component {
    constructor(props) {
        super(props);

        this.state = {
            items: []
        }
    }

    async componentDidMount() {
        let items = await notesService.getDeletedNotes();
        console.log(items);
        this.setState({items});
    }

    onItemActionsWindowRequest = () => {

    }

    onImageShowRequest = () => {

    }

    onItemDynaicFieldChange = () => {

    }

    render() {
        let {t} = this.props;

        return (
            <div className="page-wrapper">
                <Header title={t("trash")} />
                <div className="scroll page-content trash-list-page-content">
                    {
                        this.state.items.map((a) => (
                            <TrashListItem 
                                key={a.key}
                                itemData={a}
                                onShowImage={this.onImageShowRequest}
                                onDynaicFieldChange={this.onItemDynaicFieldChange}
                                onItemActionsWindowRequest={this.onItemActionsWindowRequest}
                            /> 
                        ))
                    }
                </div>
            </div>
        );
    }

}    

function mapStateToProps(state) {
    return {
        settings: state.settings,
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(Trash));