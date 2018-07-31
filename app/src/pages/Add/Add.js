import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import Textarea from "react-textarea-autosize";

import * as AppActions from '../../actions'; 

import RemovableTextCheckBox from '../../components/RemovableTextCheckBox/RemovableTextCheckBox';
import TimeSet from './TimeSet/TimeSet';
import ColorPicker from '../../components/ColorPicker/ColorPicker';
import Header from '../../components/Header/Header';
import Modal from '../../components/Modal/Modal';

import tagsService from '../../services/tags.service';

import './Add.scss';

class Add extends Component {
    constructor(props) {
        super(props);

        this.state = {
            title: "",
            dynamicFields: [{
                type: "text",
                value: ""
            }],
            notificate: false,
            startTime: false,
            endTime: false,
            tag: 'transparent',
            added: this.props.date,
            finished: 0,

            pictureSourceModal: false
        }

        this.tags = tagsService.getTags();
    }

    componentDidMount() {
        if (this.props.match.path === "/edit") {
            this.setState({...this.props.location.state.note});
        }
    }

    addInput = () => {
        this.setState({
            dynamicFields: [...this.state.dynamicFields, {
                type: "text",
                value: ""
            }]
        }, () => this.scrollToBottom())
    }

    addListItem = () => {
        this.setState({
            dynamicFields: [...this.state.dynamicFields,  {
                type: "listItem",
                value: "",
                checked: false
            }]
        }, () => {
            let inputs = document.querySelectorAll(".removable-text-checkbox-wrapper input");
            if (inputs[inputs.length - 1]) {
                inputs[inputs.length - 1].focus();
            }
            this.scrollToBottom();
        })
    }

    onDynamicItemRemove = (i) => {
        let e = this.state.dynamicFields.slice();
        e[i] = null;
        this.setState({
            dynamicFields: e
        })
    }

    addSnapshootItem = (url) => {
        this.setState({
            dynamicFields: [...this.state.dynamicFields,  {
                type: "snapshot",
                uri: url
            }],
            pictureSourceModal: false
        }, () => this.scrollToBottom())
    }

    addCameraShot = async (sourceType) => {
        window.navigator.camera.getPicture(
            (a) => {
                if (a) {
                    this.addSnapshootItem(a);
                }
            },
            (err) => {console.log(err)},
            {
                sourceType
            }
        );
    }

    getInputsValues = () => {
        return this.state
    }

    onSubmit = async () => {
        let note = this.getInputsValues();

        if (this.props.match.path === "/edit") { 
            await this.props.updateNote(note);
        } else {         
            await this.props.addNote(note);
        }

        this.props.history.goBack();
    }

    scrollToBottom() {
        let el = document.querySelector(".add-content-wrapper");
        el.scrollTop = el.scrollHeight;     
    }

    showImage = (i) => {
        let field = this.state.dynamicFields[i];
        window.PhotoViewer.show(field.uri, this.state.title, {share: false});         
    }

    render() {
        return (
            <div className="page-wrapper">
                <Header
                    page="add"
                    showCurrentDate={true}
                    onSubmit={this.onSubmit}
                />
                <div className="add-wrapper page-content">
                    <div className="add-content-wrapper">
                        <input 
                            type="text" 
                            placeholder="Заголовок"
                            value={this.state.title}
                            onChange={(e) => this.setState({title: e.target.value})}
                        />
                        {
                            this.state.dynamicFields.map((a, i) => {
                                if (a && a.type === "text") {
                                    return (
                                        <Textarea
                                            type="text"
                                            placeholder="Описание"
                                            key={i} 
                                            onChange={(e) => {
                                                let dynamicFields = this.state.dynamicFields.slice()
                                                dynamicFields[i].value = e.target.value;
                                                this.setState({dynamicFields})
                                            }}
                                            value={a.value}
                                        />
                                    )
                                } else if (a && a.type === "listItem") {
                                    return (
                                        <RemovableTextCheckBox 
                                            key={i} 
                                            onListItemRemove={() => this.onDynamicItemRemove(i)}
                                            onTextChange={(text) => {
                                                let dynamicFields = this.state.dynamicFields.slice();
                                                dynamicFields[i] = {...dynamicFields[i], value: text}                                          
                                                this.setState({dynamicFields});
                                            }}
                                            onValueChange={(value) => {
                                                let dynamicFields = this.state.dynamicFields.slice();
                                                dynamicFields[i] = {...dynamicFields[i], checked: value}                                            
                                                this.setState({dynamicFields});
                                            }}
                                            textValue={a.value} 
                                            value={a.checked}                                                                                                                       
                                        />
                                    )
                                } else if (a && a.type === "snapshot") {
                                    return (
                                        <div className="attached-image-wrapper">
                                            <img 
                                                onClick={() => this.showImage(i)}
                                                key={i}
                                                className="attached-image" 
                                                src={a.uri} 
                                                alt="attachment" />
                                            <button onClick={() => this.onDynamicItemRemove(i)}>
                                                <img
                                                    src={require('../../media/img/remove.png')} 
                                                    alt="rm"
                                                />        
                                            </button>
                                        </div>
                                    )
                                }
                                return null
                            })
                        }
                        <div className="add-actions-wrapper">
                            <button onClick={this.addListItem}>
                                <img
                                    src={require('../../media/img/add-grey.svg')} 
                                    alt="tf"                                                                
                                />   
                                <span>Пункт списка</span>     
                            </button>  
                            <button onClick={this.addInput}>
                                <img 
                                    src={require('../../media/img/add-grey.svg')} 
                                    alt="lf"                                
                                />   
                                <span>Поле</span>     
                            </button>  
                            <button 
                                className="camera-button"
                                onClick={() => this.setState({pictureSourceModal: true})}
                            >
                                <img 
                                    src={require('../../media/img/photo-camera.svg')} 
                                    alt="cam"
                                />      
                            </button> 
                        </div>
                    </div>
                    <div className="add-additionals-wrapper hide-with-active-keyboard">
                        <TimeSet
                            onStateChange={(time) => this.setState({...time})} 
                            notificate={this.state.notificate}
                            startTime={this.state.startTime}
                            endTime={this.state.endTime}
                            settings={this.props.settings}
                        />
                        <ColorPicker 
                            onSelect={(e) => this.setState({tag: tagsService.getTagByIndex(e.index)})}
                            value={this.state.tag}
                            colors={this.tags}
                        />
                    </div>

                    <Modal 
                        isOpen={this.state.pictureSourceModal}
                        onRequestClose={() => this.setState({pictureSourceModal: false})}
                        innerClassName="actions-modal-inner"
                    >
                        <button onClick={() => this.addCameraShot(window.navigator.camera.PictureSourceType.SAVEDPHOTOALBUM)}>Открыть галерею</button>
                        <button onClick={() => this.addCameraShot(window.navigator.camera.PictureSourceType.CAMERA)}>Сделать снимок</button>                       
                    </Modal>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state, props) {
    return {
        date: state.date,
        settings: state.settings
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Add);
