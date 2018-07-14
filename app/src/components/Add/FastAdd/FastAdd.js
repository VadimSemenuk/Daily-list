import React, {Component} from 'react';
import Textarea from "react-textarea-autosize";

import './FastAdd.scss';

export default class FastAdd extends Component {
    constructor(props) {
        super(props);

        this.state={
            fastAddInputValue: ''
        }
    }

    onFastAddSubmit = () => {
        this.props.onSubmit({
            added: this.props.currentDate.startOf('day'),
            title: "", 
            dynamicFields: [
                {
                    type: "text",
                    value: this.state.fastAddInputValue
                }
            ],
            notificate: false
        });
        this.setState({
            fastAddInputValue: ""
        })
    }

    render() {
        return (
            <div className="fast-add-wrapper">                
                <Textarea
                    type="text"
                    placeholder="Описание"
                    onChange={(e) => this.setState({fastAddInputValue: e.target.value})}
                    value={this.state.fastAddInputValue}
                />
                <button onClick={this.onFastAddSubmit}>
                    <img
                        src={require('../../../media/img/add-grey.svg')} 
                        alt="add"
                    />        
                </button>  
            </div> 
        )
    }
}