import React, {PureComponent} from 'react';

import TextCheckBox from '../../../components/TextCheckBox/TextCheckBox';
import CustomCheckBox from '../../../components/CustomCheckBox/CustomCheckBox';

import AlarmImg from '../../../assets/img/alarm.svg';
import MoreImg from "../../../assets/img/more.svg";
import RepeatImg from "../../../assets/img/two-circling-arrows.svg"

import './ListItem.scss';

export default class Note extends PureComponent { 
    constructor(props) {
        super(props);

        this.state = {
            expanded: false
        }
    }

    onDynaicFieldChange = (i, v) => {
        let nextDynamicField = Object.assign({}, this.props.itemData.dynamicFields[i], { checked: v })
        let nextDynamicFields = [...this.props.itemData.dynamicFields.slice(0, i), nextDynamicField, ...this.props.itemData.dynamicFields.slice(i + 1)];
        
        this.props.onDynaicFieldChange(this.props.itemData, nextDynamicFields);
    }

    onItemFinishChange = (v) => {
        this.props.onItemFinishChange(this.props.itemData, v);
    }

    onItemActionsWindowRequest = (e) => {
        e.stopPropagation();

        this.props.onItemActionsWindowRequest(this.props.itemData);
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
                <div className="note-content">
                    <div className="note-header">
                        {this.props.itemData.startTime && <span className="note-header-time">{this.props.itemData.startTime.format('HH:mm')}</span>} 
                        {this.props.itemData.endTime && <span className="note-header-time-divider">-</span>}
                        {this.props.itemData.endTime && <span className="note-header-time">{this.props.itemData.endTime.format('HH:mm')}</span>} 
                        {
                            this.props.itemData.notificate &&
                            <img 
                                className="notification-identifier"
                                src={AlarmImg}
                                alt="notify"
                            />
                        }    
                        {
                            this.props.itemData.repeatType !== "no-repeat" &&
                            <img 
                                className="repeat-identifier"
                                src={RepeatImg}
                                alt="repeat"
                            />
                        }                                   
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
                                        <span key={i} className="attached-image-label">Прикрепленное изображение</span>
                                    )
                                }
                            }
                            return null
                        })
                    }
                    <div className="more-button">
                        <button onClick={this.onItemActionsWindowRequest}>                             
                            <img
                                src={MoreImg}
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
            </div>
        )
    }
}