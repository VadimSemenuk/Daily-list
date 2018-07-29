import React, {Component} from 'react';
import Modal from 'react-modal';

import "./Modal.scss";

export default class CustomModal extends Component {
    componentDidMount() {
        if (this.props.isOpen) {
            this.setBackButtonEventHandler();
        }
    }

    componentDidUpdate(prevState) {
        if (this.props.isOpen) {
            this.setBackButtonEventHandler();   
        } else {
            this.removeBackButtonEventHandler();               
        }
    }

    componentWillUnmount() {
        this.removeBackButtonEventHandler();        
    }

    setBackButtonEventHandler = () => {
        document.addEventListener("keyup", this.onBackButtonClick)
        document.addEventListener("backbutton", this.onBackButtonClick, false);
    }

    removeBackButtonEventHandler = () => {
        document.removeEventListener("keyup", this.onBackButtonClick)
        document.addEventListener("backbutton", this.onBackButtonClick, false);        
    }

    onBackButtonClick = (e) => {
        console.log("BUTTON EVENT")
        if (e.keyCode === 27) {
            this.props.onRequestClose();
        }
    }

    static init = () => {
        Modal.setAppElement('#root');
    }

    render () {
        return (
            <Modal 
                isOpen={this.props.isOpen} 
                onRequestClose={this.props.onRequestClose}
                className={`modal ${this.props.className}`}
                overlayClassName="modal-overlay"
                animationDuration={0}
                shouldCloseOnOverlayClick={true}
                shouldCloseOnEsc={false}
            >
                <div className={`modal-inner ${this.props.innerClassName}`}>
                    {this.props.children}                        
                </div>
            </Modal>
        )
    }
}