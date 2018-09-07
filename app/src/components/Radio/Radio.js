import React from 'react';
import './Radio.scss';

export default (props) => (
  <div className="radio-wrapper">
    <label>
      <div className={`radio ${props.checked ? "active" : ""}`}>
        <input 
            {...props}
            type="radio"    
            onChange={(e) => props.onChange(e.target.value, props.text)}     
        />
        <div className="radio-inner"></div>
      </div>
      <span>{props.text}</span>
    </label>
  </div>
);
