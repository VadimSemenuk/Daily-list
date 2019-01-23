import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";

import * as AppActions from '../../actions'; 

import {ModalListItem, ButtonListItem, ValueListItem} from "../../components/ListItem/ListItem";
import RemovableTextCheckBox from '../../components/RemovableTextCheckBox/RemovableTextCheckBox';
import RemovableTextArea from '../../components/RemovableTextArea/RemovableTextArea';
import TimeSet from './TimeSet/TimeSet';
import ColorPicker from '../../components/ColorPicker/ColorPicker';
import Header from '../../components/Header/Header';
import Calendar from '../../components/Calendar/Calendar/Calendar';
import RemovableImage from "../../components/RemovableImage/RemovableImage";
import Radio from '../../components/Radio/Radio';

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
            notificate: false,
            startTime: false,
            endTime: false,
            tag: 'transparent',
            added: this.props.date,
            finished: false,
            repeatType: "no-repeat",
            repeatDates: [],
            priority: 2,

            calendar: false,
            pictureModal: false,
            prevNote: null,
            editRepeatableDialog: false,
            addAdditioanlsViewHidden: false,
            tags: notesService.getTags()
        };

        this.activeInputIndex = -1;
    }

    async componentDidMount() {
        if (this.props.match.path === "/edit") {
            let repeatDates = this.state.repeatDates;
            if (this.props.location.state.note.repeatType === "any" || this.props.location.state.note.repeatType === "week") {
                repeatDates = await notesService.getNoteRepeatDates(this.props.location.state.note);
            }
            this.setState({
                ...this.props.location.state.note, 
                repeatDates,
                prevNote: Object.assign({}, this.props.location.state.note)
            });
        }
    }

    addField(field, index) {
        let nextDynamicFields;

        if (index !== -1) {
            nextDynamicFields = [...this.state.dynamicFields.slice(0, index), field, ...this.state.dynamicFields.slice(index)];
        } else {
            nextDynamicFields = [...this.state.dynamicFields, field]
        }

        return new Promise((resolve) => {
            this.setState({
                dynamicFields: nextDynamicFields
            }, resolve)
        });
    }

    focusNext(elementToFocusSelector, elementToFocusWrapperSelector, index) {
        let inputToFocus = null;
        if (index) {
            let inputs = document.querySelectorAll(".add-content-item");
            inputToFocus = inputs[index + 1] && inputs[index + 1].querySelector(elementToFocusSelector);
            this.activeInputIndex = -1;
        } else {
            let inputs = document.querySelectorAll(elementToFocusWrapperSelector);
            if (inputs[inputs.length - 1]) {
                inputToFocus = inputs[inputs.length - 1];
            }
        }

        inputToFocus && inputToFocus.focus();
    }

    addInput = async () => {
        let field = {
            type: "text",
            value: ""
        };
        await this.addField(field, this.activeInputIndex);

        this.focusNext("textarea", ".removable-textarea-wrapper textarea", this.activeInputIndex);
        this.activeInputIndex = -1;

        this.scrollToBottom();
    };

    addListItem = async () => {
        let field = {
            type: "listItem",
            value: "",
            checked: false
        };
        await this.addField(field, this.activeInputIndex);

        this.focusNext("input", ".removable-text-checkbox-wrapper input", this.activeInputIndex);
        this.activeInputIndex = -1;

        this.scrollToBottom();
    };

    onEnterPress = async (i) => {
        let field = {
            type: "listItem",
            value: "",
            checked: false
        };
        await this.addField(field, i + 1);

        this.focusNext("input", ".removable-text-checkbox-wrapper input", i + 1);

        this.scrollToBottom();
    };

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
            // dynamicFields: [...this.state.dynamicFields.slice(0, i), null, ...this.state.dynamicFields.slice(i + 1)] 
            dynamicFields: [...this.state.dynamicFields.slice(0, i), ...this.state.dynamicFields.slice(i + 1)] 
        })
    };

    addSnapshootItem = async (url) => {
        let field = {
            type: "snapshot",
            uri: url
        };
        await this.addField(field, this.activeInputIndex);

        this.scrollToBottom();
    };

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
    };

    getInputsValues = () => {
        let dynamicFields = this.state.dynamicFields.filter((a) => a !== null);
        return {
            ...this.state, 
            dynamicFields
        }
    };

    onSubmit = async () => {
        let note = this.getInputsValues();

        if (this.props.match.path === "/edit") {
            await this.props.updateNote(note, this.props.settings.calendarNotesCounter);
        } else {
            await this.props.addNote(note, this.props.settings.calendarNotesCounter);
        }

        this.props.history.goBack();
    };

    scrollToBottom() {
        let el = document.querySelector(".add-content-wrapper");
        el.scrollTop = el.scrollHeight;
    }

    showImage = (i) => {
        let field = this.state.dynamicFields[i];
        window.PhotoViewer.show(field.uri, this.state.title, {share: false});         
    };

    triggerCalendar = () => {
        this.setState({calendar: !this.state.calendar})
    };

    onDateSelect = (date) => {
        this.setState({
            added: date
        })
    };

    catchFocusedInput = () => {
        let activeElement = document.activeElement.closest(".add-content-item");

        let nodes = Array.prototype.slice.call(document.querySelector(".add-content-wrapper").children);
        let index = nodes.indexOf(activeElement);
        this.activeInputIndex = index;
    };

    render() {
        let {t} = this.props;
        let priorityOptions = notesService.getPriorityOptions();
        let selectedPriorityOption = priorityOptions.find((a) => a.val === this.state.priority);

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
                            className="title add-content-item"
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
                                        <RemovableTextArea
                                            key={i}
                                            className="add-content-item"
                                            placeholder={t("input-placeholder-text")}
                                            value={a.value}
                                            onChange={(value) => {
                                                let dynamicFields = this.state.dynamicFields.slice();
                                                dynamicFields[i].value = value;
                                                this.setState({dynamicFields});
                                            }}
                                            onListItemRemove={() => this.onDynamicItemRemove(i)}
                                        />
                                    )
                                } else if (a.type === "listItem") {
                                    return (
                                        <RemovableTextCheckBox 
                                            key={i} 
                                            className="add-content-item"
                                            onListItemRemove={(inputRef) => this.onDynamicItemRemove(i, inputRef)}
                                            onTextChange={(text) => {
                                                let dynamicFields = this.state.dynamicFields.slice();
                                                dynamicFields[i] = {...dynamicFields[i], value: text};                                        
                                                this.setState({dynamicFields});
                                            }}
                                            onValueChange={(value) => {
                                                let dynamicFields = this.state.dynamicFields.slice();
                                                dynamicFields[i] = {...dynamicFields[i], checked: value};                                         
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
                                            className="add-content-item"
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
                            <button
                                onTouchStart={this.catchFocusedInput}
                                onClick={this.addListItem}
                            >
                                <img
                                    src={AddGeryImg} 
                                    alt="tf"                                                                
                                />   
                                <span>{t("list-item-btn")}</span>     
                            </button>  
                            <button 
                                onTouchStart={this.catchFocusedInput}                                
                                onClick={this.addInput}
                            >
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
                                        onTouchStart={this.catchFocusedInput}
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
                        className={`add-additionals-wrapper hide-with-active-keyboard${this.state.addAdditioanlsViewHidden ? " hidden-triggered" : ""}`}
                        style={{borderColor: this.state.tag !== "transparent" ? this.state.tag : ""}}
                    >
                        <div 
                            className="toggle-icon-wrapper"
                            onClick={() => this.setState({addAdditioanlsViewHidden: !this.state.addAdditioanlsViewHidden})}
                        >
                            <div className="line"></div>
                        </div>

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

                        <ModalListItem
                            className="tiny priority-select"
                            text={t("priority")} 
                            value={t(selectedPriorityOption.translateId)}
                            listItem={ValueListItem}
                        >
                            <div className="radio-group">
                                {
                                    priorityOptions.map((setting, i) => (
                                        <Radio
                                            key={i}
                                            name="repeat-type"
                                            checked={this.state.priority === setting.val}
                                            value={setting.val}
                                            onChange={(val) => this.setState({priority: +val})}
                                            text={t(setting.translateId)}
                                        />
                                    ))
                                }
                            </div>
                        </ModalListItem>

                        <ColorPicker 
                            onSelect={(e) => this.setState({tag: notesService.getTagByIndex(e.index)})}
                            value={this.state.tag}
                            colors={this.state.tags}
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
