import React, { Component } from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import moment from "moment";

import * as AppActions from '../../../actions'; 

import Radio from '../../Elements/Radio/Radio';

import './SettingsSort.scss';

class SettingsSort extends Component {
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
            <div className="settings-sort-wrapper settings-page-wrapper scroll">
                <div className="settings-sort-section setting-section">
                    <div className="settings-sort-section-title">Сортировка:</div>
                    <div className="settings-sort-item setting-item">
                        <Radio 
                            name="sort"
                            checked={this.props.settings.sort === 1}
                            value={1}
                            onChange={(e) => this.onValueSet("sort", +e.target.value)}
                        />
                        <span>По возрастанию указанному времени</span>
                    </div> 
                    <div className="settings-sort-item setting-item">
                        <Radio
                            name="sort"
                            checked={this.props.settings.sort === 2}
                            value={2}                
                            onChange={(e) => this.onValueSet("sort", +e.target.value)}
                        />
                        <span>По убыванию указанному времени вниз</span>
                    </div> 
                    <div className="settings-sort-item setting-item">
                        <Radio 
                            name="sort"
                            checked={this.props.settings.sort === 3}
                            value={3}                
                            onChange={(e) => this.onValueSet("sort", +e.target.value)}
                        />
                        <span>По возрастанию времени добавления</span>
                    </div> 
                    <div className="settings-sort-item setting-item">
                        <Radio 
                            name="sort"
                            checked={this.props.settings.sort === 4}
                            value={4}                
                            onChange={(e) => this.onValueSet("sort", +e.target.value)}
                        />
                        <span>По убыванию времени добавления</span>
                    </div>
                </div>
                <div className="settings-sort-section setting-section">
                    <div className="settings-sort-section-title">Завершенные заметки:</div>
                    <div className="settings-sort-item setting-item">
                        <Radio 
                            name="sort"
                            checked={this.props.settings.finishedSort === 1}
                            value={1}
                            onChange={(e) => this.onValueSet("finishedSort", +e.target.value)}
                        />
                        <span>Показывать</span>
                    </div> 
                    <div className="settings-sort-item setting-item">
                        <Radio 
                            name="sort"
                            checked={this.props.settings.finishedSort === 2}
                            value={2}                
                            onChange={(e) => this.onValueSet("finishedSort", +e.target.value)}
                        />
                        <span>Перемещать вниз</span>
                    </div> 
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