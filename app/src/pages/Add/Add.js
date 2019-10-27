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

import deepCopy from '../../utils/deepCopyObject'

import './Add.scss';

import * as Hammer from "hammerjs";

class Add extends Component {
    constructor(props) {
        super(props);

        this.state = {
            title: "",
            dynamicFields: [],
            notificate: false,
            startTime: false,
            endTime: false,
            tag: 'transparent',
            added: this.props.date,
            finished: false,
            repeatType: "no-repeat",
            repeatDates: [],
            priority: 2,
            mode: this.props.settings.notesScreenMode,

            calendar: false,
            pictureModal: false,
            editRepeatableDialog: false,
            tags: notesService.getTags()
        };
    }

    componentDidMount() {
        if (this.props.match.path === "/edit") {
            this.setState({...this.props.location.state.note});
            this.prevNote = deepCopy(this.props.location.state.note);
        }

        this.prepareSwipeHandler();
    }

    componentWillUnmount() {
        this.unsubscribeSwipeHandler();
    }

    prepareSwipeHandler() {
        let toggleElement = document.querySelector('.toggle-icon-wrapper');
        let manager = new Hammer.Manager(toggleElement);
        let Swipe = new Hammer.Swipe();
        manager.add(Swipe);

        let swipe = null;
        manager.on("swipeup swipedown", onSwipe);
        function onSwipe(e) {
            swipe = {
                type: e.type
            };
        }

        var mc = new Hammer(toggleElement);
        mc.get('pan').set({
            direction: Hammer.DIRECTION_ALL
        });

        let moveElement = document.querySelector('.add-additionals-wrapper');
        let maxTranslateX = moveElement.clientHeight - 20;
        let changePositionMinTranslateX = maxTranslateX / 2;

        let elementYStateBeforePan = 0;
        let currentPanDeltaY = 0;
        let isPanned = false;
        mc.on("panup pandown", onPan);
        function onPan(e) {
            currentPanDeltaY = e.deltaY;
            let elementY = elementYStateBeforePan + e.deltaY;

            if (elementY > maxTranslateX || elementY < 0) {
                return
            }

            isPanned = true;

            moveElement.style.transform = `translateY(${elementY}px)`;
        }

        toggleElement.addEventListener('touchstart', onTouchStart);
        function onTouchStart() {
            currentPanDeltaY = 0;
            toggleElement.classList.add("is-touching");
        }

        toggleElement.addEventListener('touchend', onTouchEnd);
        function onTouchEnd() {
            toggleElement.classList.remove("is-touching");

            if (swipe) {
                if (swipe.type === "swipeup") {
                    moveElement.style.transform = `translateY(0px)`;
                    elementYStateBeforePan = 0;
                } else {
                    moveElement.style.transform = `translateY(${maxTranslateX}px)`;
                    elementYStateBeforePan = maxTranslateX;
                }
                swipe = null;
                isPanned = false;
            } else if (isPanned) {
                if (currentPanDeltaY > 0) {
                    if (currentPanDeltaY > changePositionMinTranslateX) {
                        moveElement.style.transform = `translateY(${maxTranslateX}px)`;
                        elementYStateBeforePan = maxTranslateX;
                    } else {
                        moveElement.style.transform = `translateY(0px)`;
                        elementYStateBeforePan = 0;
                    }
                } else {
                    if (currentPanDeltaY > -changePositionMinTranslateX) {
                        moveElement.style.transform = `translateY(${maxTranslateX}px)`;
                        elementYStateBeforePan = maxTranslateX;
                    } else {
                        moveElement.style.transform = `translateY(0px)`;
                        elementYStateBeforePan = 0;
                    }
                }

                isPanned = false;
            }
        }

        toggleElement.addEventListener('click', onClick);
        function onClick() {
            if (!isPanned) {
                if (elementYStateBeforePan === 0) {
                    moveElement.style.transform = `translateY(${maxTranslateX}px)`;
                    elementYStateBeforePan = maxTranslateX;
                } else {
                    moveElement.style.transform = `translateY(0px)`;
                    elementYStateBeforePan = 0;
                }
            }
        }

        this.unsubscribeSwipeHandler = () => {
            mc.off("panup pandown", onPan);
            manager.off("swipeup swipedown", onSwipe);
            toggleElement.removeEventListener('touchstart', onTouchStart);
            toggleElement.removeEventListener('touchend', onTouchEnd);
            toggleElement.removeEventListener('click', onClick);
        }
    }

    addField(field, index) {
        let nextDynamicFields = [...this.state.dynamicFields.slice(0, index), field, ...this.state.dynamicFields.slice(index)];

        return new Promise((resolve) => {
            this.setState({
                dynamicFields: nextDynamicFields
            }, resolve)
        });
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
                return true;
            } else if (field.querySelector("input")) {
                field.querySelector("input").focus();
                return true;
            }
        }
        return false;
    }

    addInput = async () => {
        let field = {
            type: "text",
            value: ""
        };
        let focusedDynamicFieldIndex = this.getFocusedFieldIndex();
        let nextIndex = focusedDynamicFieldIndex !== null ? (focusedDynamicFieldIndex + 1) : this.state.dynamicFields.length;
        await this.addField(field, nextIndex);
        this.focusDynamicField(nextIndex);
        this.scrollToBottom();
    };

    addListItem = async () => {
        let field = {
            type: "listItem",
            value: "",
            checked: false
        };
        let focusedDynamicFieldIndex = this.getFocusedFieldIndex();
        let nextIndex = focusedDynamicFieldIndex !== null ? (focusedDynamicFieldIndex + 1) : this.state.dynamicFields.length;
        await this.addField(field, nextIndex);
        this.focusDynamicField(nextIndex);
        this.scrollToBottom();
    };

    onDynamicItemRemove = async (i) => {
        await new Promise((resolve) => {
            this.setState({
                dynamicFields: [...this.state.dynamicFields.slice(0, i), ...this.state.dynamicFields.slice(i + 1)]
            }, resolve);
        });
        if (!this.focusDynamicField(i)) {
            this.focusDynamicField(i - 1);
        }
    };

    addSnapshootItem = async (url) => {
        let field = {
            type: "snapshot",
            uri: url
        };

        let focusedDynamicFieldIndex = this.getFocusedFieldIndex();
        let nextIndex = focusedDynamicFieldIndex !== null ? (focusedDynamicFieldIndex + 1) : this.state.dynamicFields.length;

        await this.addField(field, nextIndex);
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
        let field = this.state.dynamicFields[i];
        window.PhotoViewer.show(field.uri, this.state.title, {share: false});         
    };

    triggerCalendar = () => {
        this.setState({calendar: !this.state.calendar})
    };

    onDateSelect = (date) => {
        this.setState({
            added: date
        });
    };

    setDefaultAddedDate = () => {
        this.setState({
            added: this.props.date
        });
    }

    render() {
        let {t} = this.props;
        let priorityOptions = notesService.getPriorityOptions();
        let selectedPriorityOption = priorityOptions.find((a) => a.val === this.state.priority);

        return (
            <div className="page-wrapper">
                <Header
                    page={(this.props.settings.notesScreenMode === 1) ? "daily-add" : "add"}
                    onSubmit={this.onSubmit}
                    onCalendarRequest={this.triggerCalendar}
                    currentDate={this.state.added}
                    onResetAddedDate={this.setDefaultAddedDate}
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
                                    return null;
                                } else if (a.type === "text") {
                                    return (
                                        <RemovableTextArea
                                            key={i}
                                            className="add-content-item dynamic-field"
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
                                            className="add-content-item dynamic-field"
                                            onListItemRemove={(inputRef) => this.onDynamicItemRemove(i)}
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
                                            onEnterPress={() => this.addListItem(i)}
                                            textValue={a.value} 
                                            value={a.checked}                                                                                                                       
                                        />
                                    )
                                } else if (a.type === "snapshot") {
                                    return (
                                        <RemovableImage 
                                            key={i}
                                            className="add-content-item dynamic-field"
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
                                onTouchStart={this.saveFocusedElement}
                                onClick={this.addListItem}
                            >
                                <img
                                    src={AddGeryImg} 
                                    alt="tf"                                                                
                                />   
                                <span>{t("list-item-btn")}</span>     
                            </button>  
                            <button
                                onTouchStart={this.saveFocusedElement}
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
                        className={`add-additionals-wrapper hide-with-active-keyboard${this.props.settings.notesScreenMode === 1 ? "" : " minified"}`}
                        style={{borderColor: this.state.tag !== "transparent" ? this.state.tag : ""}}
                    >
                        {
                            (this.props.settings.notesScreenMode === 1) &&
                            <div
                                className="toggle-icon-wrapper"
                            >
                                <div className="line"></div>
                            </div>
                        }

                        {
                            (this.props.settings.notesScreenMode === 1) &&
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
                        }

                        {
                            (this.props.settings.notesScreenMode === 1) &&
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