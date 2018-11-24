import React, { PureComponent } from 'react';
import Textarea from "react-textarea-autosize";

import RemoveImg from '../../assets/img/remove.png';

import './RemovableTextArea.scss';

export default class RemovableTextArea extends PureComponent {
    onChange = (e) => this.props.onChange(e.target.value);

    render () {
        return (
            <div className={`removable-textarea-wrapper ${this.props.className || ""}`}>
                <Textarea
                    className="textarea"
                    type="text"
                    placeholder={this.props.placeholder}
                    onChange={this.onChange}
                    value={this.props.value}
                />
                <button onClick={this.props.onListItemRemove}>
                    <img
                        src={RemoveImg} 
                        alt="rm"
                    />        
                </button>
            </div>
        )
    }
}