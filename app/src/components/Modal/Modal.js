import React, {Component} from 'react';
import Modal from 'react-responsive-modal';

class Add extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    render () {
        return (
            <Modal
                center
                showCloseIcon={false}
                classNames={{
                    modal: "modal",
                    overlay: "modal-overlay"
                }}
                animationDuration={0}
                open={true} 
                {...props}
            >
                <div className="modal-inner">                    
                </div>
            </Modal>
        )
    }
}