import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";

import * as AppActions from '../../actions'; 

import Header from '../../components/Header/Header';
import TrashListItem from './TrashListItem/TrashListItem';
import Modal from "../../components/Modal/Modal";

import './Trash.scss';

class Trash extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isCleanTrashConfirmationOpen: false,
        }
    }

    async componentDidMount() {
        this.props.getDeletedNotes();
    }

    onRestore = (note) => this.props.restoreNote(note);

    render() {
        let {t} = this.props;

        return (
            <div className="page-wrapper">
                <Header title={t("trash")} />
                <div className="page-content trash-list-page-content">
                    {this.props.trash.length !== 0 && <div style={{color: "#aaa"}} className="text-center">{t("remove-old")}</div>}
                    <div className="scroll items-wrapper">
                        {
                            this.props.trash.length === 0 &&
                            <div className="no-content">{t("no-content")}</div>
                        }
                        {
                            this.props.trash.map((note) => (
                                <TrashListItem
                                    key={note.id}
                                    data={note}
                                    minimize={this.props.settings.minimizeNotes}
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
                                onClick={() => this.setState({isCleanTrashConfirmationOpen: true})}
                            >{t("clean-trash")}</button>
                        </div>
                    }
                </div>

                <Modal
                    isOpen={this.state.isCleanTrashConfirmationOpen}
                    className="clean-trash-confirmation-modal"
                    onRequestClose={() => this.setState({isCleanTrashConfirmationOpen: false})}
                    actionItems={[
                        {
                            text: t("close")
                        },
                        {
                            text: t("ok"),
                            onClick: () => this.props.removeDeletedNotes()
                        }
                    ]}
                >
                    {t("clean-trash-confirmation")}
                </Modal>
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