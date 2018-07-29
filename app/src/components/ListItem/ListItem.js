import React, {Component} from 'react';

import Switch from '../../components/Switch/Switch';

import './ListItem.scss';

import arrowRight from '../../media/img/right-grey.svg';

export let SwitchListItem = (props) => (
    <div className="list-item">
        <span className="list-item-text">{props.text}</span>
        <Switch 
            checked={props.checked}
            onChange={props.onChange}
        />
    </div>
)

export let InsetListItem = (props) => (
    <button 
        className="list-item inset-list-item"
        onClick={props.onClick}                                
    >
        <span className="list-item-text">{props.text}</span>
        <img 
            className="list-item-img"
            src={arrowRight} 
            alt="in"
        /> 
    </button>
)

export let ListItem = (props) => (
    <button 
        className="list-item"
        onClick={props.onClick}                                
    >
        <span className="list-item-text">{props.text}</span>
    </button>
)