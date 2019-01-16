import React, {PureComponent} from 'react';

import './CustomCheckBox.scss';

import CheckedImage from '../../assets/img/checkbox/checked.png';
import UncheckedImage from '../../assets/img/checkbox/unchecked.png';

export default class CustomCheckBox extends PureComponent {
    handleToggleChecked = (e) => {
        e.stopPropagation();
        this.props.onChange && this.props.onChange(!this.props.checked);
    };

    empty = (e) => {
        e.stopPropagation();
    };

    render() {
        return (
            <div 
                className="customcheckbox-wrapper clickable"
                onClick={this.handleToggleChecked}
                onTouchStart={this.empty}
                onTouchEnd={this.empty}
            >
                <img 
                    src={this.props.checked ? CheckedImage : UncheckedImage}
                    alt="chbx"
                />
            </div>
        )
    }
}