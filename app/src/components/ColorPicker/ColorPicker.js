import React, {Component} from 'react';

import tagsService from '../../services/tags.service';

import './ColorPicker.scss';  

export default class ColorPicker extends Component {
    render() {   
        return (
            <div className="color-picker-list-wrapper">
                {
                    tagsService.getTags().map((a, i) => {
                        return (
                            <button 
                                className={`color-item-wrapper ${this.props.value === a ? "active" : ""}`}
                                key={i}
                                onClick={() => this.props.onStateChange(tagsService.getTagByIndex(i))}
                            >
                                <div 
                                    className="color-item"
                                    style={{backgroundColor: a}}
                                ></div>
                            </button>
                        )
                    })
                }
            </div>
        )
    }
}