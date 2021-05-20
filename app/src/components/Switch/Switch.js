import React, { PureComponent } from 'react';
import './Switch.css';

class Switch extends PureComponent {
  onClick = (e) => {
    e.stopPropagation();

    if (this.props.disabled && !this.props.clickEventWhileDisabled) {
      return false;
    }
    this.props.onChange(!this.props.checked)
  };

  render() {
    return (
      <div 
        className={`switch${this.props.checked ? " active" : ""}${this.props.disabled ? " disabled" : ""}`}
        onClick={this.onClick}
      >
        <div className="switch-asix"></div>
        <div className="switch-circle"></div>        
      </div>
    );
  }
}

export default Switch;
