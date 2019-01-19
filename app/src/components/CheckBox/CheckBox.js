import React, { PureComponent } from 'react';

import './CheckBox.css';

class CheckBox extends PureComponent {
  onClick = (e) => {
    e.stopPropagation();
    this.props.onChange(!this.props.checked)
  };

  render() {
    return (
      <div className="light-checkbox-wrapper">
        <div 
          className={`light-checkbox ${this.props.checked ? "active" : ""}`}
          onClick={this.onClick}
        ></div>
      </div>
    );
  }
}

export default CheckBox;
