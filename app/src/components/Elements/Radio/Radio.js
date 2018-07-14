import React, { PureComponent } from 'react';
import './Radio.css';

class Radio extends PureComponent {
  render() {
    return (
      <label className={`radio ${this.props.checked ? "active" : ""}`}>
        <input 
            {...this.props}
            type="radio"         
        />
        <div className="radio-inner"></div>
      </label>
    );
  }
}

export default Radio;
