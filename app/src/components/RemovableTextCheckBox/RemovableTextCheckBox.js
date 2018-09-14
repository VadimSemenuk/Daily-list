import React, { PureComponent } from 'react';

import CheckBox from '../CheckBox/CheckBox';

import RemoveImg from '../../assets/img/remove.png';

import './RemovableTextCheckBox.scss';

export default class RemovableTextCheckBox extends PureComponent {
    ref;

    onTextChange = (e) => this.props.onTextChange(e.target.value);

    onListItemRemove = (e) => this.props.onListItemRemove(this.ref);

    onListItemRemove = (e) => this.props.onListItemRemove(this.ref);

    onKeyPress = (e) => e.key === "Enter" && this.props.onEnterPress()

    render () {
        return (
            <div 
                className="removable-text-checkbox-wrapper"
                ref={(a) => this.ref = a}
            >
                <CheckBox 
                    checked={this.props.value}
                    onChange={this.props.onValueChange}
                />
                <input 
                    type="text"
                    onChange={this.onTextChange}
                    value={this.props.textValue}
                    className={`content-input${this.props.value ? " crossed" : ""}`}
                    onKeyPress={this.onKeyPress}
                />
                <button onClick={this.onListItemRemove}>
                    <img
                        src={RemoveImg} 
                        alt="rm"
                    />        
                </button>
            </div>
        )
    }
}