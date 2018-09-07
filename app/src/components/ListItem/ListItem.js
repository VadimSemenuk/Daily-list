import React, {PureComponent} from 'react';

import Switch from '../../components/Switch/Switch';
import Modal from "../../components/Modal/Modal";

import './ListItem.scss';

import arrowRight from '../../assets/img/right-grey.svg';

export let SwitchListItem = (props) => (
    <div className={`list-item switch-list-item ${props.className} ${props.disabled ? "disabled" : ""}`}>
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

export let ButtonListItem = (props) => (
    <button 
        className={`list-item ${props.className}`}
        style={props.style}
        onClick={props.onClick}                                
    >
        <span className="list-item-text">{props.text}</span>
        {props.ValElement && <props.ValElement />}
    </button>
)

export let ListItem = (props) => (
    <div 
        className={`list-item ${props.className}`}
        style={props.style}                              
    >
        <span className="list-item-text">{props.text}</span>
        <props.ValElement />
    </div>
)

export let ValueListItem = (props) => (
    <button 
        className={`list-item trigger-list-item ${props.triggerValue ? " active" : ""}  ${props.className}`}
        onClick={props.onClick}                                
    >
        <span className="list-item-text">{props.text}</span>
        <span className="list-item-value">{props.value}</span>        
    </button>
)

export class ModalListItem extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            isModalActive: false
        }
    }

    trigger = () => {
        this.setState({
            isModalActive: !this.state.isModalActive
        })
    }

    render () {
        return ([
            <this.props.listItem
                {...this.props}
                key={0}
                onClick={this.trigger} 
            />,

            <Modal 
                key={1}            
                isOpen={this.state.isModalActive}
                onRequestClose={this.trigger}
                innerClassName={this.props.innerClassName}
            >
                {this.props.children}
            </Modal>
        ])
    }
}

export class TriggerListItem extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            isActive: false
        }
    }

    trigger = () => {
        this.setState({
            isActive: !this.state.isActive
        })
    }

    render () {
        return ([
            <button 
                key={0}
                className={`list-item trigger-list-item ${this.state.isActive ? " active" : ""}`}
                onClick={this.trigger}                                
            >
                <span className="list-item-text">{this.props.text}</span>
                <img 
                    className="list-item-img"
                    src={arrowRight} 
                    alt="in"
                /> 
            </button>,

            this.state.isActive && 
            <div key={1}>{this.props.children}</div>
        ])
    }
}