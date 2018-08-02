import React, { Component } from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import moment from "moment";

import * as AppActions from '../../actions'; 

import Radio from '../../components/Radio/Radio';
import Header from '../../components/Header/Header';
import { InsetListItem, SwitchListItem } from "../../components/ListItem/ListItem";
import Modal from "../../components/Modal/Modal";

import './SettingsSort.scss';

class SettingsSort extends Component {
    constructor(props) {
        super(props);

        this.state = {
            sortModal: false,
            orderModal: false,
            finsModal: false
        }
    }

    onValueSet = async (setting, v) => {
        await this.props.setSetting(setting, v);
    }

    componentWillUnmount() {
        this.props.getNotesByDates(
            [
                moment(this.props.currentDate).add(-1, "day"),
                moment(this.props.currentDate).startOf("day"),
                moment(this.props.currentDate).add(1, "day")
            ],
            this.props.settings
        ); 
    }

    render() {
        return (
            <div className="page-wrapper">
                <Header title="Отображение" />
                <div className="scroll page-content padding">
                    <InsetListItem 
                        text="Сортировка"
                        onClick={() => this.setState({sortModal: true})}
                    />
                    <Modal 
                        isOpen={this.state.sortModal}
                        onRequestClose={() => this.setState({sortModal: false})}
                    >
                        <div className="radio-group">
                            <Radio 
                                name="sort"
                                checked={this.props.settings.sort === 1}
                                value={1}
                                onChange={(e) => this.onValueSet("sort", +e.target.value)}
                                text="По указанному времени"
                            />
                            <Radio
                                name="sort"
                                checked={this.props.settings.sort === 2}
                                value={2}                
                                onChange={(e) => this.onValueSet("sort", +e.target.value)}
                                text="По времени добавления"
                            />
                        </div>
                    </Modal>

                    <InsetListItem 
                        text="Порядок отображения"
                        onClick={() => this.setState({orderModal: true})}
                    />
                    <Modal 
                        isOpen={this.state.orderModal}
                        onRequestClose={() => this.setState({orderModal: false})}
                    >
                        <div className="radio-group">
                            <Radio 
                                name="sort"
                                checked={this.props.settings.sort === 1}
                                value={1}
                                onChange={(e) => this.onValueSet("sort", +e.target.value)}
                                text="В прямом порядке"
                            />
                            <Radio
                                name="sort"
                                checked={this.props.settings.sort === 2}
                                value={2}                
                                onChange={(e) => this.onValueSet("sort", +e.target.value)}
                                text="В обратном порядке"
                            />
                        </div>
                    </Modal>

                    <SwitchListItem 
                        text="Перемещать завершенные вниз"  
                        checked={this.props.settings.finishedSort}
                        onChange={(e) => this.props.setSetting('finishedSort', +e)}     
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

export default connect(mapStateToProps, mapDispatchToProps)(SettingsSort);