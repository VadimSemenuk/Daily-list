import React, {PureComponent} from 'react';

import './CustomCheckBox.scss';

import CheckedImage from '../../../media/img/checkbox/checked.png';
import UncheckedImage from '../../../media/img/checkbox/unchecked.png';

export default class CustomCheckBox extends PureComponent {
    handleToggleChecked = (e) => {
        e.stopPropagation();
        this.props.onChange && this.props.onChange(!this.props.checked);
    }

    render() {
        return (
            <div 
                className="customcheckbox-wrapper"
                onClick={this.handleToggleChecked}
            >
                <img 
                    src={this.props.checked ? CheckedImage : UncheckedImage}
                    alt="chbx"
                />
            </div>
        )
    }
}