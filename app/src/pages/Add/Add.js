import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import Textarea from "react-textarea-autosize";
import {translate} from "react-i18next";
import moment from "moment";

import * as AppActions from '../../actions'; 

import {ModalListItem, ButtonListItem} from "../../components/ListItem/ListItem";
import RemovableTextCheckBox from '../../components/RemovableTextCheckBox/RemovableTextCheckBox';
import TimeSet from './TimeSet/TimeSet';
import ColorPicker from '../../components/ColorPicker/ColorPicker';
import Header from '../../components/Header/Header';
import Calendar from '../../components/Calendar/Calendar/Calendar';
import RemovableImage from "../../components/RemovableImage/RemovableImage";

import notesService from '../../services/notes.service';

import CameraImg from '../../assets/img/photo-camera.svg';
import AddGeryImg from '../../assets/img/add-grey.svg';

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
            notificate: true,
            startTime: false,
            endTime: false,
            tag: 'transparent',
            added: this.props.date,
            finished: false,
            repeatType: "no-repeat",
            repeatDates: [moment(this.props.date).valueOf()],

            calendar: false,
            pictureModal: false,
            prevNote: null,
            editRepeatableDialog: false
        }

        this.tags = notesService.getTags();
    }

    async componentDidMount() {
        if (this.props.match.path === "/edit") {
            let repeatDates = this.state.repeatDates;
            if (this.props.location.state.note.repeatType === "any") {
                repeatDates = await notesService.getNoteRepeatDates(this.props.location.state.note);
            }
            this.setState({
                ...this.props.location.state.note, 
                repeatDates,
                prevNote: Object.assign({}, this.props.location.state.note)
            });
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

    onEnterPress = (i) => {
        let field = {
            type: "listItem",
            value: "",
            checked: false
        };

        this.setState({
            dynamicFields: [...this.state.dynamicFields.slice(0, i + 1), field, ...this.state.dynamicFields.slice(i + 1)]
        }, () => {
            let input = document.querySelector(".removable-text-checkbox-wrapper input:focus");
            if (input) {
                let next = input.parentElement.nextSibling.querySelector("input.content-input");
                next.focus();
            }
        })
    }

    onDynamicItemRemove = (i, ref) => {
        if (ref) {
            let nextSibling = ref.nextSibling;
            if (nextSibling.classList.contains("removable-text-checkbox-wrapper")) {
                nextSibling.querySelector("input").focus();
            } else {
                let prevSibling = ref.previousSibling;
                if (prevSibling.classList.contains("removable-text-checkbox-wrapper")) {
                    prevSibling.querySelector("input").focus();
                } 
            }
        }

        this.setState({
            dynamicFields: [...this.state.dynamicFields.slice(0, i), null, ...this.state.dynamicFields.slice(i + 1)] 
        })
    }

    addSnapshootItem = (url) => {
        this.setState({
            dynamicFields: [...this.state.dynamicFields,  {
                type: "snapshot",
                uri: url
            }]
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
                sourceType,
                saveToPhotoAlbum: true,
                quality: 50,
                destinationType: window.navigator.camera.DestinationType.FILE_URI,
                encodingType: window.navigator.camera.EncodingType.JPEG,
                mediaType: window.navigator.camera.MediaType.PICTURE,
                correctOrientation: true,
                targetHeight: 3000,
                targetWidth: 3000
            }
        );
    }

    getInputsValues = () => {
        return {...this.state}
    }

    onSubmit = async () => {
        let note = this.getInputsValues();

        if (this.props.match.path === "/edit") {
            await this.props.updateNote(note, this.props.settings.calendarNotesCounter);
        } else {
            await this.props.addNote(note, this.props.settings.calendarNotesCounter);
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

    triggerCalendar = () => {
        this.setState({calendar: !this.state.calendar})
    }

    onDateSelect = (date) => {
        this.setState({
            added: date
        })
    }

    render() {
        let {t} = this.props;

        return (
            <div className="page-wrapper">
                <Header
                    page="add"
                    onSubmit={this.onSubmit}
                    onCalendarRequest={this.triggerCalendar}
                    currentDate={this.state.added}
                />
                {
                    this.state.calendar &&
                    <Calendar 
                        currentDate={this.state.added}
                        calendarNotesCounter={this.props.settings.calendarNotesCounter}
                        onDateSet={this.onDateSelect}
                        onCloseRequest={this.triggerCalendar}
                    />
                }
                <div className="add-wrapper page-content">
                    <div className="add-content-wrapper">
                        <input
                            className="title"
                            type="text" 
                            placeholder={t("input-placeholder-title")}
                            value={this.state.title}
                            onChange={(e) => this.setState({title: e.target.value})}
                        />
                        {
                            this.state.dynamicFields.map((a, i) => {
                                if (!a) {
                                    return null
                                } else if (a.type === "text") {
                                    return (
                                        <Textarea
                                            type="text"
                                            placeholder={t("input-placeholder-text")}
                                            key={i} 
                                            onChange={(e) => {
                                                let dynamicFields = this.state.dynamicFields.slice()
                                                dynamicFields[i].value = e.target.value;
                                                this.setState({dynamicFields})
                                            }}
                                            value={a.value}
                                        />
                                    )
                                } else if (a.type === "listItem") {
                                    return (
                                        <RemovableTextCheckBox 
                                            key={i} 
                                            onListItemRemove={(inputRef) => this.onDynamicItemRemove(i, inputRef)}
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
                                            onEnterPress={() => this.onEnterPress(i)}
                                            textValue={a.value} 
                                            value={a.checked}                                                                                                                       
                                        />
                                    )
                                } else if (a.type === "snapshot") {
                                    return (
                                        <RemovableImage 
                                            key={i}
                                            src={a.uri}
                                            onClick={() => this.showImage(i)}
                                            onRemove={() => this.onDynamicItemRemove(i)}
                                        />
                                    )
                                }
                                return null
                            })
                        }
                        <div className="add-actions-wrapper">
                            <button onClick={this.addListItem}>
                                <img
                                    src={AddGeryImg} 
                                    alt="tf"                                                                
                                />   
                                <span>{t("list-item-btn")}</span>     
                            </button>  
                            <button onClick={this.addInput}>
                                <img 
                                    src={AddGeryImg} 
                                    alt="lf"                                
                                />   
                                <span>{t("field-btn")}</span>     
                            </button>  

                            <ModalListItem
                                ref={(r) => this.photoModal = r}
                                listItem={(props) => (
                                    <button 
                                        onClick={props.onClick}
                                        className="camera-button"
                                    >
                                        <img 
                                            src={CameraImg} 
                                            alt="cam"
                                        />      
                                    </button> 
                                )}
                            >
                                <ButtonListItem
                                    className="no-border"
                                    text={t("open-galery")}
                                    onClick={() => {
                                        this.addCameraShot(window.navigator.camera.PictureSourceType.SAVEDPHOTOALBUM);
                                        this.photoModal.trigger();
                                    }}
                                />

                                <ButtonListItem
                                    className="no-border"
                                    text={t("make-shot")}
                                    onClick={() => {
                                        this.addCameraShot(window.navigator.camera.PictureSourceType.CAMERA);
                                        this.photoModal.trigger();                                        
                                    }}
                                />
                            </ModalListItem>
                        </div>
                    </div>
                    <div 
                        className="add-additionals-wrapper hide-with-active-keyboard" 
                        style={{borderColor: this.state.tag !== "transparent" ? this.state.tag : ""}}
                    >
                        <TimeSet
                            notificate={this.state.notificate}
                            startTime={this.state.startTime}
                            endTime={this.state.endTime}
                            settings={this.props.settings}
                            repeatType={this.state.repeatType}
                            currentDate={this.state.added}
                            repeatDates={this.state.repeatDates}
                            mode={this.props.match.path === "/edit" ? "edit" : "add"}
                            onStateChange={(time) => this.setState({...time})} 
                        />
                        <ColorPicker 
                            onSelect={(e) => this.setState({tag: notesService.getTagByIndex(e.index)})}
                            value={this.state.tag}
                            colors={this.tags}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        date: state.date,
        settings: state.settings      
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(Add));
