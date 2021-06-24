import React from 'react';

import './Tag.scss';

let Tag = (props) => (
    <div
        className={`tag${props.isActive ? ' theme-tag' : ''}`}
        onClick={props.onClick || (() => null)}
    >{props.name}</div>
);

export default Tag;