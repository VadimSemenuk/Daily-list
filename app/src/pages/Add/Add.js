import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";

import * as AppActions from '../../actions'; 

import {ModalListItem, ButtonListItem} from "../../components/ListItem/ListItem";
import RemovableTextCheckBox from '../../components/RemovableTextCheckBox/RemovableTextCheckBox';
import RemovableTextArea from '../../components/RemovableTextArea/RemovableTextArea';
import TimeSet from './TimeSet/TimeSet';
import ColorPicker from '../../components/ColorPicker/ColorPicker';
import Header from '../../components/Header/Header';
import Calendar from '../../components/Calendar/Calendar/Calendar';
import RemovableImage from "../../components/RemovableImage/RemovableImage";

import notesService from '../../services/notes.service';

import CameraImg from '../../assets/img/photo-camera.svg';
import AddGeryImg from '../../assets/img/add-grey.svg';

import deepCopy from '../../utils/deepCopyObject'

import {NoteContentItemType, NoteRepeatType, NotesScreenMode} from "../../constants";

import './Add.scss';

class Add extends Component {
    constructor(props) {
        super(props);

        this.state = {
            note: this.getDefaultNoteData(),

            isCalendarOpen: false,
            pictureModal: false,
            editRepeatableDialog: false,
            isNoteSettingViewVisible: true,
            tags: notesService.getTags()
        };
    }

    getDefaultNoteData() {
        return {
            title: "",
            contentItems: [],
            isNotificationEnabled: false,
            startTime: false,
            endTime: false,
            tag: 'transparent',
            date: this.props.date,
            isFinished: false,
            repeatType: NoteRepeatType.NoRepeat,
            repeatDates: [],
            mode: this.props.settings.notesScreenMode,
        }
    }

    async componentDidMount() {
        if (this.props.match.path === "/edit") {
            this.setState(deepCopy(this.props.location.state.note));
            this.prevNote = deepCopy(this.props.location.state.note);
        }
    }

    getDynamicFiledElements() {
        return Array.prototype.slice.call(document.querySelectorAll(".dynamic-field"));
    }

    saveFocusedElement = () => {
        this.lastFocusedElement = document.activeElement;
    }

    getFocusedFieldIndex() {
        let focusedDynamicField;
        let activeElement;
        if (document.activeElement && document.activeElement.closest(".dynamic-field")) {
            activeElement = document.activeElement;
        } else if (this.lastFocusedElement && this.lastFocusedElement.closest(".dynamic-field")) {
            activeElement = this.lastFocusedElement;
        } else {
            return null;
        }

        focusedDynamicField = activeElement.closest(".dynamic-field");

        return this.getDynamicFiledElements().indexOf(focusedDynamicField);
    }

    focusDynamicField(index) {
        let field = this.getDynamicFiledElements()[index];
        if (field) {
            if (field.querySelector("textarea")) {
                field.querySelector("textarea").focus();
            } else if (field.querySelector("input")) {
                field.querySelector("input").focus();
            }
        }
    }

    canFocusDynamicField(index) {
        let field = this.getDynamicFiledElements()[index];
        return field && (field.querySelector("textarea") || field.querySelector("input"))
    }

    addInputContentItem = async () => {
        let field = {
            type: NoteContentItemType.Text,
            value: ""
        };
        let focusedDynamicFieldIndex = this.getFocusedFieldIndex();
        let nextIndex = focusedDynamicFieldIndex !== null ? (focusedDynamicFieldIndex + 1) : this.state.note.contentItems.length;
        await this.addContentItem(field, nextIndex);
        this.focusDynamicField(nextIndex);
        this.scrollToBottom();
    };

    addListItemContentItem = async () => {
        let field = {
            type: NoteContentItemType.ListItem,
            value: "",
            checked: false
        };
        let focusedDynamicFieldIndex = this.getFocusedFieldIndex();
        let nextIndex = focusedDynamicFieldIndex !== null ? (focusedDynamicFieldIndex + 1) : this.state.note.contentItems.length;
        await this.addContentItem(field, nextIndex);
        this.focusDynamicField(nextIndex);
        this.scrollToBottom();
    };

    addPhotoContentItem = async (url) => {
        let field = {
            type: NoteContentItemType.Photo,
            uri: url
        };

        let focusedDynamicFieldIndex = this.getFocusedFieldIndex();
        let nextIndex = focusedDynamicFieldIndex !== null ? (focusedDynamicFieldIndex + 1) : this.state.note.contentItems.length;

        await this.addContentItem(field, nextIndex);
        this.scrollToBottom();
    };

    addContentItem(contentItem, index) {
        let nextContentItems = [...this.state.note.contentItems.slice(0, index), contentItem, ...this.state.note.contentItems.slice(index)];
        return this.updateNoteData({contentItems: nextContentItems})
    }

    updateNoteContentItem(contentItemIndex, nextState) {
        let nextContentItems = [
            ...this.state.note.contentItems.slice(0, contentItemIndex),
            {...this.state.note.contentItems[contentItemIndex], ...nextState},
            ...this.state.note.contentItems.slice(contentItemIndex + 1)
        ];
        this.updateNoteData({contentItems: nextContentItems});
    }

    removeContentItem = async (contentItemIndex) => {
        let nextContentItems = [...this.state.note.contentItems.slice(0, contentItemIndex), ...this.state.note.contentItems.slice(contentItemIndex + 1)];
        await this.updateNoteData({contentItems: nextContentItems});

        if (!this.canFocusDynamicField(contentItemIndex)) {
            this.focusDynamicField(contentItemIndex - 1);
        }
    };

    async updateNoteData(nextData) {
        await new Promise((resolve) => {
            this.setState({
                note: {
                    ...this.state.note,
                    ...nextData
                }
            }, resolve);
        });
    }

    addCameraShot = async (sourceType) => {
        window.navigator.camera.getPicture(
            (a) => {
                if (a) {
                    this.addPhotoContentItem(a);
                }
            },
            (err) => {
                this.props.triggerErrorModal("error-common");
            },
            {
                sourceType,
                saveToPhotoAlbum: true,
                quality: 100,
                destinationType: window.navigator.camera.DestinationType.FILE_URI,
                mediaType: window.navigator.camera.MediaType.PICTURE,
            }
        );
    };

    getNoteData = () => {
        let contentItems = this.state.note.contentItems.filter((a) => a !== null);
        return {
            ...this.state.note,
            contentItems
        }
    };

    submit = async () => {
        let note = this.getNoteData();

        if (note.repeatType !== NoteRepeatType.NoRepeat) {
            note.date = -1;
        }

        if (this.props.match.path === "/edit") {
            await this.props.updateNote(note, this.prevNote);
        } else {
            await this.props.addNote(note);
        }

        this.props.history.goBack();
    };

    scrollToBottom() {
        let el = document.querySelector(".add-content-wrapper");
        el.scrollTop = el.scrollHeight;
    }

    showImage = (i) => {
        let field = this.state.note.contentItems[i];
        window.PhotoViewer.show(field.uri, this.state.note.title, {share: false});
    };

    triggerCalendar = () => {
        this.setState({isCalendarOpen: !this.state.isCalendarOpen})
    };

    render() {
        let {t} = this.props;

        return (
            <div className="page-wrapper">
                <Header
                    page={(this.props.settings.notesScreenMode === NotesScreenMode.WithDateTime) ? "daily-add" : "add"}
                    onSubmit={this.submit}
                    onCalendarRequest={this.triggerCalendar}
                    currentDate={this.state.note.date}
                    onResetAddedDate={() => this.updateNoteData(this.props.date)}
                />
                {
                    this.state.isCalendarOpen &&
                    <Calendar 
                        currentDate={this.state.note.date}
                        calendarNotesCounter={this.props.settings.calendarNotesCounter}
                        onDateSet={(date) => this.updateNoteData({date: date})}
                        onCloseRequest={this.triggerCalendar}
                    />
                }
                <div className="add-wrapper page-content">
                    <div className="add-content-wrapper">
                        <input
                            className="title add-content-item"
                            type="text" 
                            placeholder={t("input-placeholder-title")}
                            value={this.state.note.title}
                            onChange={(e) => this.updateNoteData({title: e.target.value})}
                        />
                        {
                            this.state.note.contentItems.map((contentItem, i) => {
                                if (!contentItem) {
                                    return null;
                                } else if (contentItem.type === NoteContentItemType.Text) {
                                    return (
                                        <RemovableTextArea
                                            key={i}
                                            className="add-content-item dynamic-field"
                                            placeholder={t("input-placeholder-text")}
                                            value={contentItem.value}
                                            onChange={(value) => this.updateNoteContentItem(i, {value})}
                                            onListItemRemove={() => this.removeContentItem(i)}
                                        />
                                    )
                                } else if (contentItem.type === NoteContentItemType.ListItem) {
                                    return (
                                        <RemovableTextCheckBox 
                                            key={i} 
                                            className="add-content-item dynamic-field"
                                            onListItemRemove={() => this.removeContentItem(i)}
                                            onTextChange={(value) => this.updateNoteContentItem(i, {value})}
                                            onValueChange={(value) => this.updateNoteContentItem(i, {checked: value})}
                                            onEnterPress={() => this.addListItemContentItem(i)}
                                            textValue={contentItem.value}
                                            value={contentItem.checked}
                                        />
                                    )
                                } else if (contentItem.type === NoteContentItemType.Photo) {
                                    return (
                                        <RemovableImage 
                                            key={i}
                                            className="add-content-item dynamic-field"
                                            src={contentItem.uri}
                                            onClick={() => this.showImage(i)}
                                            onRemove={() => this.removeContentItem(i)}
                                        />
                                    )
                                }
                                return null;
                            })
                        }
                        <div className="add-actions-wrapper">
                            <button
                                onTouchStart={this.saveFocusedElement}
                                onClick={this.addInputContentItem}
                            >
                                <img
                                    src={AddGeryImg} 
                                    alt="tf"                                                                
                                />   
                                <span>{t("list-item-btn")}</span>     
                            </button>  
                            <button
                                onTouchStart={this.saveFocusedElement}
                                onClick={this.addListItemContentItem}
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
                                        onTouchStart={this.saveFocusedElement}
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
                        className={`add-additionals-wrapper hide-with-active-keyboard${!this.state.isNoteSettingViewVisible ? " hidden-triggered" : ""}${this.props.settings.notesScreenMode === NotesScreenMode.WithDateTime ? "" : " minified"}`}
                        style={{borderColor: this.state.tag !== "transparent" ? this.state.tag : ""}}
                    >
                        {
                            (this.props.settings.notesScreenMode === NotesScreenMode.WithDateTime) &&
                            <div
                                className="toggle-icon-wrapper"
                                onClick={() => this.setState({isNoteSettingViewVisible: !this.state.isNoteSettingViewVisible})}
                            >
                                <div className="line"></div>
                            </div>
                        }

                        {
                            (this.props.settings.notesScreenMode === NotesScreenMode.WithDateTime) &&
                            <TimeSet
                                isNotificationEnabled={this.state.note.isNotificationEnabled}
                                startTime={this.state.note.startTime}
                                endTime={this.state.note.endTime}
                                settings={this.props.settings}
                                repeatType={this.state.note.repeatType}
                                currentDate={this.state.note.date}
                                repeatDates={this.state.note.repeatDates}
                                mode={this.props.match.path === "/edit" ? "edit" : "add"}
                                onStateChange={(time) => this.updateNoteData({...time})}
                            />
                        }

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