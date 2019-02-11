import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import Textarea from "react-textarea-autosize";
import {translate} from "react-i18next";

import * as AppActions from '../../actions'; 

import './FastAdd.scss';

import addImg from '../../assets/img/add-grey.svg';

class FastAdd extends Component {
    constructor(props) {
        super(props);

        this.state={
            fastAddInputValue: ''
        }
    }

    onFastAddSubmit = () => {
        this.props.addNote({
            added: this.props.currentDate.startOf('day'),
            title: "", 
            dynamicFields: [
                {
                    type: "text",
                    value: this.state.fastAddInputValue
                }
            ],
            notificate: false,
            repeatType: "no-repeat",
            repeatDates: []
        }, this.props.settings.calendarNotesCounter);
        this.setState({
            fastAddInputValue: ""
        })
    };

    render() {
        let {t} = this.props;

        return (
            <div className="fast-add-wrapper">                
                <Textarea
                    type="text"
                    placeholder={t("description")}
                    onChange={(e) => this.setState({fastAddInputValue: e.target.value})}
                    value={this.state.fastAddInputValue}
                />
                {
                    this.state.fastAddInputValue &&
                    <button onClick={this.onFastAddSubmit}>
                        <img
                            src={addImg}
                            alt="add"
                        />
                    </button>
                }
            </div> 
        )
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

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(FastAdd));
