import React, {Component} from 'react';
import Modal from 'react-responsive-modal';

class Add extends Component {
    constructor(props) {
        super(props);
    }

    render () {
        return (
            <Modal {...props}>
                <div className="actions-modal-inner">
                    {
                        this.props.buttons.map((button) => (
                            <button onClick={button.onClick}>Открыть галерею</button>
                        ))
                    }
                </div>
            </Modal>
        )
    }
}