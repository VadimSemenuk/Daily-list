import React from 'react';

import './ColorPicker.scss';  

export default (props) => (
    <div className={`color-picker-list-wrapper${props.disabled ? " disabled" : ""}`}>
        {
            props.colors.map((colorsItem, i) => {
                let color = colorsItem;
                let value = props.value;
                if (props.field) {
                    color = colorsItem[props.field];
                    value = props.value[props.field];
                }

                return (
                    <button 
                        className={`color-item-wrapper${value === color ? " active" : ""}`}
                        key={i}
                        onClick={() => props.onSelect({color: colorsItem, index: i})}
                    >
                        <div 
                            className={`color-item${color === "transparent" ? " black-tick" : ""}`}
                            style={{backgroundColor: color}}
                        ></div>
                    </button>
                )
            })
        }
    </div>
)