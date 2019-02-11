import React, {Component} from 'react';
import Modal from 'react-modal';

import "./Modal.scss";

export default class CustomModal extends Component {
    componentDidMount() {
        if (this.props.isOpen && !this.props.noExit) {
            this.setBackButtonEventHandler();
        }
    }

    componentDidUpdate() {
        if (this.props.isOpen && !this.props.noExit) {
            this.setBackButtonEventHandler();   
        } else {
            this.removeBackButtonEventHandler();  
        }
    }

    componentWillUnmount() {
        this.removeBackButtonEventHandler();        
    }

    setBackButtonEventHandler = () => {
        document.addEventListener("backbutton", this.onBackButtonClick, false);
    };

    removeBackButtonEventHandler = () => {
        document.removeEventListener("backbutton", this.onBackButtonClick, false);        
    };

    onBackButtonClick = (e) => {
        this.props.onRequestClose();
    };

    static init = () => {
        Modal.setAppElement('#root');
    };

    onActionButtonClick = (action) => {
        this.props.onRequestClose();    
        action && action();
    };

    render () {
        return (
            <Modal 
                isOpen={Boolean(this.props.isOpen)} 
                onRequestClose={this.props.onRequestClose}
                className={`modal ${this.props.className}`}
                overlayClassName="modal-overlay"
                animationDuration={0}
                shouldCloseOnOverlayClick={!this.props.noExit}
                shouldCloseOnEsc={false}
            >
                <div className={`modal-inner ${this.props.innerClassName ? this.props.innerClassName : ""}`}>
                    {this.props.children}

                    {
                        this.props.actionItems &&
                        <div className="action-buttons-wrapper">
                            {
                                this.props.actionItems.map((a, i) => (
                                    <button 
                                        key={i}
                                        className="text clear" 
                                        onClick={() => this.onActionButtonClick(a.onClick)}
                                    >{a.text}</button>
                                ))
                            }
                        </div>  
                    }                     
                </div>
            </Modal>
        )
    }
}