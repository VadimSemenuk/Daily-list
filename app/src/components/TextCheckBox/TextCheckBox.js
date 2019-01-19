import React, {PureComponent} from 'react';

import CheckBox from '../CheckBox/CheckBox';

import './TextCheckBox.scss';

export default class TextCheckBox extends PureComponent {
    onValueChange = (e) => this.props.onValueChange(this.props.id, e);

    render () {
        return (
            <div className="textcheckbox-wrapper item-data-checkbox">
                <CheckBox 
                    checked={this.props.checkBoxValue}
                    onChange={this.onValueChange}
                />
                <span className={`text ${this.props.checkBoxValue && this.props.cross !== false && 'crossed'}`}>{this.props.textValue}</span>
            </div>
        )
    }
}