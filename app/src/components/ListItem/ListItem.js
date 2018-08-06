import React, {PureComponent} from 'react';

import Switch from '../../components/Switch/Switch';
import Modal from "../../components/Modal/Modal";

import './ListItem.scss';

import arrowRight from '../../assets/img/right-grey.svg';

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
        style={props.style}
        onClick={props.onClick}                                
    >
        <span className="list-item-text">{props.text}</span>
        <props.ValElement />
    </button>
)

export let SelectListItem = (props) => (
    <button 
        className="list-item"
        onClick={props.onClick}                                
    >
        <span className="list-item-text">{props.text}</span>
        <select 
            value={props.value}
            onChange={(e) => props.onSelect(e.target.value)}
        >
            <option value="12">12</option>
            <option value="13">13</option>
            <option value="14">14</option>
            <option value="15">15</option>
            <option value="16">16</option>
            <option value="17">17</option>
            <option value="18">18</option>                            
        </select>
    </button>
)

export let TriggerListItem = (props) => (
    <button 
        className={`list-item trigger-list-item ${props.triggerValue ? " active" : ""}`}
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

export let ValueListItem = (props) => (
    <button 
        className={`list-item trigger-list-item ${props.triggerValue ? " active" : ""}`}
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

    triggerModal = () => {
        this.setState({
            isModalActive: !this.state.isModalActive
        })
    }

    render () {
        return ([
            <this.props.listItem
                {...this.props}
                onClick={this.triggerModal} 
            />, 

            <Modal 
                isOpen={this.state.isModalActive}
                onRequestClose={this.triggerModal}
            >
                {this.props.children}
            </Modal>
        ])
    }
}