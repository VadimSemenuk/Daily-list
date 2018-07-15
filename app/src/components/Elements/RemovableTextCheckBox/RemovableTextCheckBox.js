import React, { PureComponent } from 'react';

import CheckBox from '../CheckBox/CheckBox';

import './RemovableTextCheckBox.scss';

export default class RemovableTextCheckBox extends PureComponent {
    onValueChange = (e) => this.props.onValueChange(e);   

    onTextChange = (e) => this.props.onTextChange(e.target.value);

    render () {
        return (
            <div className="removable-text-checkbox-wrapper">
                <CheckBox 
                    checked={this.props.value}
                    onChange={this.onValueChange}
                />
                <input 
                    type="text"
                    onChange={this.onTextChange}
                    value={this.props.textValue}
                    className={`content-input ${this.props.value ? "crossed" : ""}`}
                />
                <button onClick={this.props.onListItemRemove}>
                    <img
                        src={require('../../../media/img/remove.png')} 
                        alt="rm"
                    />        
                </button>
            </div>
        )
    }
}