import React, {Component} from 'react';

import tagsService from '../../../services/tags.service';

import './Tag.scss';  

export default class Tag extends Component {
    render() {   
        return (
            <div className="tags-wrapper">
                {
                    tagsService.getTags().map((a, i) => {
                        return (
                            <button 
                                className={`tag-wrapper ${this.props.value === a ? "active" : ""}`}
                                key={i}
                                onClick={() => this.props.onStateChange(tagsService.getTagByIndex(i))}
                            >
                                <div 
                                    className="tag"
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