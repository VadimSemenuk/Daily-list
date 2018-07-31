import React from 'react';
import pasteImg from "../../media/img/insert.svg";

export default () => (
    <button 
        className="fab"
        onClick={this.props.onClick}
    >
        <img 
            src={pasteImg}
            alt="insert"
        />
    </button>
)