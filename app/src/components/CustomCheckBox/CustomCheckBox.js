import React, {PureComponent} from 'react';

import './CustomCheckBox.scss';

import Checkbox from '../../assets/img/checkbox/checkbox.svg';
import CheckboxChecked from '../../assets/img/checkbox/checkbox-checked.svg';

export default class CustomCheckBox extends PureComponent {
    handleToggleChecked = (e) => {
        e.stopPropagation();
        this.props.onChange && this.props.onChange(!this.props.checked);
    };

    render() {
        return (
            <div 
                className="customcheckbox-wrapper clickable"
                onClick={this.handleToggleChecked}
            >
                <img 
                    src={this.props.checked ? CheckboxChecked : Checkbox}
                    alt="chbx"
                />
            </div>
        )
    }
}