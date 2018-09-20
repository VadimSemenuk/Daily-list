import React from 'react';
import pasteImg from "../../assets/img/insert.svg";

import './Fab.scss';

export default (props) => (
    <button 
        className="fab theme-header-background"
        onClick={props.onClick}
    >
        <img 
            src={pasteImg}
            alt="insert"
        />
    </button>
)