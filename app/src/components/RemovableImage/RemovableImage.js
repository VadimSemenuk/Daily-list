import React from "react";

import "./RemovableImage.scss";

import RemoveImage from "../../assets/img/remove.png";

export default (props) => (
    <div className={`attached-image-wrapper ${props.className}`}>
        <img
            onClick={props.onClick}
            className="attached-image" 
            src={props.src} 
            alt="attachment" 
        />
        <button onClick={props.onRemove}>
            <img
                src={RemoveImage} 
                alt="rm"
            />        
        </button>
    </div>
)