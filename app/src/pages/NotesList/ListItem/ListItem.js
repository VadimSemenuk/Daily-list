import React, {PureComponent} from 'react';
import moment from "moment";

import TextCheckBox from '../../../components/TextCheckBox/TextCheckBox';
import CustomCheckBox from '../../../components/CustomCheckBox/CustomCheckBox';

import './ListItem.scss';

function getTime (date) {
    if (date === "false") {
        return ""
    }
    if (date) {
        return moment(date).format('HH:mm')
    } else {
        return null
    }
}

export default class Note extends PureComponent { 
    constructor(props) {
        super(props);

        this.state = {
            expanded: false
        }
    }

    onDynaicFieldChange = (i, v) => {
        let dynamicFields = this.props.itemData.dynamicFields.slice();
        dynamicFields[i].checked = v;
        this.props.onDynaicFieldChange(this.props.dayIndex, this.props.index, this.props.itemData, dynamicFields);
    }

    onItemFinishChange = (v) => {
        this.props.onItemFinishChange(this.props.dayIndex, this.props.index, this.props.itemData, v);
    }

    onItemActionsWindowRequest = (e) => {
        e.stopPropagation();

        this.props.onItemActionsWindowRequest(this.props.dayIndex, this.props.index);
    }

    triggerExpanded = () => {
        this.setState({expanded: !this.state.expanded})
    }

    showImage = (e) => {
        e.stopPropagation();
        
        window.PhotoViewer.show(e.target.src, this.props.itemData.title, {share: false});         
    }

    render () {
        return (
            <div 
                className={`note-wrapper ${this.state.expanded && 'expanded'}`} 
                onClick={this.triggerExpanded}
            >
                <div
                    style={{backgroundColor: this.props.itemData.tag}} 
                    className="tag"
                ></div>
                <div className="note-header">
                    <div className="note-header-time-wrapper">
                        {this.props.itemData.startTime && <span>{getTime(this.props.itemData.startTime)}</span>} 
                        {this.props.itemData.endTime && <span className="divider">-</span>}
                        {this.props.itemData.endTime && <span>{getTime(this.props.itemData.endTime)}</span>}                 
                    </div>
                    {this.props.itemData.notificate ? <div className="notification-identifier"></div> : null}                                     
                </div>
                {!!this.props.itemData.title && <div className="note-title">{this.props.itemData.title}</div>}
                {
                    this.props.itemData.dynamicFields.map((a, i) => {
                        if (a && a.type === "text") {
                            return (
                                <div 
                                    className="item-data-text" 
                                    key={i}
                                >{a.value}</div>
                            )
                        } else if (a && a.type === "listItem") {
                            return (
                                <TextCheckBox 
                                    key={i} 
                                    id={i}
                                    textValue={a.value}
                                    checkBoxValue={a.checked}
                                    onValueChange={this.onDynaicFieldChange}
                                />
                            )
                        } else if (a && a.type === "snapshot") {
                            if (this.state.expanded) {
                                return (
                                    <img 
                                        onClick={this.showImage}
                                        key={i}
                                        className="attached-image" 
                                        src={a.uri} 
                                        alt="attachment" 
                                    />
                                )
                            } else {
                                return (
                                    <span className="attached-image-label">Прикрепленное изображение</span>
                                )
                            }
                        }
                        return null
                    })
                }
                <div className="more-button">
                    <button onClick={this.onItemActionsWindowRequest}>                             
                        <img
                            src={require("../../../media/img/more.svg")}
                            alt="more"
                        />
                    </button>
                </div>
                <div className="note-finish-checkbox">
                    <CustomCheckBox
                        checked={this.props.itemData.finished}
                        onChange={this.onItemFinishChange}
                    />
                </div>
            </div>
        )
    }
}