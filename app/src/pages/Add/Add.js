import React, {Component, Fragment} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";
import moment from "moment";

import * as AppActions from '../../actions'; 

import {ModalListItem, ButtonListItem} from "../../components/ListItem/ListItem";
import RemovableTextCheckBox from '../../components/RemovableTextCheckBox/RemovableTextCheckBox';
import RemovableTextArea from '../../components/RemovableTextArea/RemovableTextArea';
import ColorPicker from '../../components/ColorPicker/ColorPicker';
import Header from '../../components/Header/Header';
import Calendar from '../../components/Calendar/Calendar/Calendar';
import RemovableImage from "../../components/RemovableImage/RemovableImage";
import Switch from "../../components/Switch/Switch";
import RepeatTypeSelectModal from "./RepeatTypeSelectModal/RepeatTypeSelectModal";
import TagList from "../../components/TagList/TagList";

import notesService from '../../services/notes.service';

import ImageImg from '../../assets/img/image.svg';
import TextImg from '../../assets/img/text.svg';
import ListImg from '../../assets/img/list.svg';
import ClockImg from '../../assets/img/clock.svg';
import RepeatImg from '../../assets/img/repeat.svg';
import NotificationImg from '../../assets/img/notification.svg';
import CalendarImg from "../../assets/img/calendar.svg";
import CheckedImg from "../../assets/img/tick.svg";
import WarningImg from "../../assets/img/warning.svg";

import deepCopy from '../../utils/deepCopyObject'

import {
    ColorTags,
    NoteContentItemType,
    NoteRepeatType,
    NotesScreenMode,
    NoteUpdateType,
} from "../../constants";

import './Add.scss';
import Modal from "../../components/Modal/Modal";
import {getTime} from "../../utils/timeFromDateTime";

class Add extends Component {
    constructor(props) {
        super(props);

        let initialDate = moment(this.props.date);

        let mode = this.props.match.path === "/edit" ? "edit" : "add";
        let note = this.getDefaultNoteData(initialDate);

        if (mode === "edit") {
            this.originalNote = deepCopy(this.props.location.state.props.note);
            note = this.getNoteData(this.props.location.state.props.note);
        }

        this.state = {
            note: note,
            calendarValue: initialDate,
            isCalendarOpen: false,
            isRepeatTypeSelectModalOpen: false,
            isNotificationWasUnchecked: false,
            mode: mode,
            calendarPeriod: null,
            busyTimePeriods: [],
            isSaveTypeModalVisible: false
        };

        this.saveTypeSelectResolve = null;
    }

    getNoteData = (originalNote) => {
        let note = deepCopy(originalNote);

        return {
            title: note.title,
            contentItems: note.contentItems,
            isNotificationEnabled: note.isNotificationEnabled,
            startTime: note.startTime,
            endTime: note.endTime,
            tag: note.tag,
            date: note.repeatType === NoteRepeatType.NoRepeat ? note.date : null,
            repeatType: note.repeatType,
            repeatValues: note.repeatValues,
            mode: note.mode,
            tags: note.tags
        }
    }

    getDefaultNoteData = (initialDate) => {
        return {
            title: "",
            contentItems: [],
            isNotificationEnabled: false,
            startTime: null,
            endTime: null,
            tag: 'transparent',
            date: moment(initialDate),
            repeatType: NoteRepeatType.NoRepeat,
            repeatValues: [],
            mode: this.props.settings.notesScreenMode,
            tags: []
        }
    }

    async componentDidMount() {
        if (this.state.mode === "add") {
            if (this.props.location.state && this.props.location.state.props.tagsSelected.length && this.props.location.state.props.tagsSelected.length) {
                await this.updateNoteData({tags: this.props.location.state.props.tagsSelected.map((id) => this.props.tags.find((tag) => tag.id === id))});
            }

            await this.addInputContentItem();
            if (this.props.location.state && this.props.location.state.props.focusUsingPlugin) {
                this.focusDynamicField(0, true);
            }
        }

        if (this.state.note.repeatType === NoteRepeatType.NoRepeat) {
            this.setState({
                busyTimePeriods: await this.getBusyTimePeriods()
            });
        }
    }

    getBusyTimePeriods = async () => {
        if (!this.state.note.date) {
            return [];
        }

        let notes = (await notesService.getNotesWithTime([this.state.note.date]))[0].items;
        return notes
            .filter((note) => note.startTime && note.endTime && (note.id !== this.state.note.id))
            .map((note) => [moment(note.startTime), moment(note.endTime)]);
    }

    getDynamicFiledElements = () => {
        return Array.prototype.slice.call(document.querySelectorAll(".dynamic-field"));
    }

    saveFocusedElement = () => {
        this.lastFocusedElement = document.activeElement;
    }

    getFocusedFieldIndex = () => {
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

    focusDynamicField = (index, usePlugin = false) => {
        let field = this.getDynamicFiledElements()[index];
        if (field) {
            let el = field.querySelector("textarea") || field.querySelector("input");
            if (usePlugin) {
                window.cordova && el && window.cordova.plugins.Focus.focus(el);
            } else {
                el.focus();
            }

            let caretPosition = el.value ? el.value.length : 0;
            el.setSelectionRange(caretPosition, caretPosition);
        }
    }

    canFocusDynamicField = (index) => {
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

        let prevContentItem = this.state.note.contentItems[nextIndex - 1];
        if (prevContentItem && prevContentItem.type === NoteContentItemType.Text && !prevContentItem.value) {
            this.focusDynamicField(nextIndex - 1);
            return;
        }
        let nextContentItem = this.state.note.contentItems[nextIndex];
        if (nextContentItem && nextContentItem.type === NoteContentItemType.Text && !nextContentItem.value) {
            this.focusDynamicField(nextIndex);
            return;
        }

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

        let prevContentItem = this.state.note.contentItems[nextIndex - 1];
        if (prevContentItem && prevContentItem.type === NoteContentItemType.Text && !prevContentItem.value) {
            await this.removeContentItem(nextIndex - 1);
            nextIndex = nextIndex - 1;
        }
        if (prevContentItem && prevContentItem.type === NoteContentItemType.ListItem && !prevContentItem.value) {
            this.focusDynamicField(nextIndex - 1);
            return;
        }
        let nextContentItem = this.state.note.contentItems[nextIndex];
        if (nextContentItem && nextContentItem.type === NoteContentItemType.ListItem && !nextContentItem.value) {
            this.focusDynamicField(nextIndex);
            return;
        }

        await this.addContentItem(field, nextIndex);
        this.focusDynamicField(nextIndex);
        this.scrollToBottom();
    };

    addImageContentItem = async (url) => {
        let field = {
            type: NoteContentItemType.Image,
            value: url
        };

        let focusedDynamicFieldIndex = this.getFocusedFieldIndex();
        let nextIndex = focusedDynamicFieldIndex !== null ? (focusedDynamicFieldIndex + 1) : this.state.note.contentItems.length;

        await this.addContentItem(field, nextIndex);
        this.scrollToBottom();
    };

    addContentItem = (contentItem, index) => {
        let nextContentItems = [...this.state.note.contentItems.slice(0, index), contentItem, ...this.state.note.contentItems.slice(index)];
        return this.updateNoteData({contentItems: nextContentItems})
    }

    updateNoteContentItem = (contentItemIndex, nextState, event) => {
        let moveCaretToPosition = null;

        if (this.isNewRowAdded(this.state.note.contentItems[contentItemIndex].value, nextState.value) && event) {
            let rows = this.state.note.contentItems[contentItemIndex].value.split("\n");
            let cursorPos = event.target.selectionStart;

            let charCounter = 0;
            let targetRowIndex = null;
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];

                charCounter += row.length + 1;
                if (charCounter >= cursorPos) {
                    targetRowIndex = i;
                    break;
                }
            }

            if (targetRowIndex !== null) {
                if (rows[targetRowIndex][0] === "-") {
                    let nextTargetRow = rows[targetRowIndex];
                    if (/^-\S+/.test(nextTargetRow)) {
                        nextTargetRow = nextTargetRow.replace("-", "- ");
                    } else {
                        nextTargetRow = nextTargetRow.replace(/^-\s+/, "- ");
                    }
                    nextTargetRow += "\n- ";

                    let nextValue = [
                        ...rows.slice(0, targetRowIndex),
                        nextTargetRow,
                        ...rows.slice(targetRowIndex + 1)
                    ].join("\n");
                    nextState.value = nextValue;

                    let nextCursorPosition = [
                        ...rows.slice(0, targetRowIndex),
                        nextTargetRow
                    ].reduce((acc, item) => acc += item.length + 1, 0) - 1;
                    moveCaretToPosition = nextCursorPosition;
                }
            }
        }

        let nextContentItems = [
            ...this.state.note.contentItems.slice(0, contentItemIndex),
            {...this.state.note.contentItems[contentItemIndex], ...nextState},
            ...this.state.note.contentItems.slice(contentItemIndex + 1)
        ];
        this.updateNoteData({contentItems: nextContentItems});

        if (moveCaretToPosition !== null) {
            setTimeout(() => {
                let el = this.getDynamicFiledElements()[contentItemIndex];
                el.querySelector('textarea').setSelectionRange(moveCaretToPosition, moveCaretToPosition);
            });
        }
    }

    isNewRowAdded = (prevValue, value) => prevValue.split("\n").length < value.split("\n").length

    removeContentItem = async (contentItemIndex) => {
        let nextContentItems = [...this.state.note.contentItems.slice(0, contentItemIndex), ...this.state.note.contentItems.slice(contentItemIndex + 1)];
        await this.updateNoteData({contentItems: nextContentItems});

        if (this.canFocusDynamicField(contentItemIndex)) {
            this.focusDynamicField(contentItemIndex);
        } else if (this.canFocusDynamicField(contentItemIndex - 1)) {
            this.focusDynamicField(contentItemIndex - 1);
        }
    };

    addImage = async (sourceType) => {
        let url = await this.getPicture(sourceType)
            .catch((err) => {
                if (err === "No Image Selected") {
                    return null;
                }
                this.props.triggerErrorModal("error-common")
            });

        if (url) {
            this.addImageContentItem(url);
        }
    };

    getPicture(sourceType) {
        return new Promise((resolve, reject) => {
            window.navigator.camera.getPicture(resolve, reject,
                {
                    sourceType,
                    saveToPhotoAlbum: true,
                    quality: 100,
                    mediaType: window.navigator.camera.MediaType.PICTURE,
                }
            );
        });
    }

    getSubmitData = () => {
        let contentItems = this.state.note.contentItems.filter((a) => a !== null);
        return {
            ...this.state.note,
            contentItems,
        }
    };

    submit = async () => {
        let data = this.getSubmitData();

        if (this.state.mode === "add") {
            await this.add(data);
        } else {
            await this.update(data);
        }

        this.props.history.goBack();
    };

    add = async (note) => {
        await this.props.addNote(note);
    }

    update = async (data) => {
        if (data.repeatType === NoteRepeatType.NoRepeat && this.originalNote.repeatType === NoteRepeatType.NoRepeat) {
            // no-repeat
            await this.props.updateNote(data, this.originalNote, NoteUpdateType.NO_REPEAT);
        } else if (
            (data.repeatType !== this.originalNote.repeatType)
            || (JSON.stringify(data.repeatValues.sort()) !== JSON.stringify(this.originalNote.repeatValues.sort()))
        ) {
            // repeat type change
            await this.props.updateNote(data, this.originalNote, NoteUpdateType.REPEAT_TYPE_CHANGE);
        } else {
            // repeat
            let updateType = await this.selectNoteUpdateType();
            if (!updateType) {
                return;
            }

            await this.props.updateNote(data, this.originalNote, updateType);
        }
    }

    scrollToBottom = () => {
        let el = document.querySelector(".add-content-wrapper");
        el.scrollTop = el.scrollHeight;
    }

    showImage = (e) => {
        window.PhotoViewer.show(e.target.src, this.state.note.title, {share: false});
    };

    triggerCalendar = () => {
        this.setState({isCalendarOpen: !this.state.isCalendarOpen})
    };

    onNotificationStateChange = (state) => {
        if (!this.state.note.startTime) {
            window.plugins.toast.showLongBottom(this.props.t("set-time-first"));
            return;
        }

        if (!this.state.isNotificationWasUnchecked && !state) {
            this.setState({
                isNotificationWasUnchecked: true
            });
        }

        this.updateNoteData({isNotificationEnabled: state});
    }

    pickTime = async (field) => {
        let dateTime = null;
        if (window.cordova) {
            dateTime = await new Promise((resolve, reject) => {
                window.cordova.plugins.DateTimePicker.show({
                    mode: 'time',
                    date: (this.state.note[field] || moment()).toDate(),
                    success: (data) => resolve(getTime(moment(data))),
                    cancel: () => this.resetTime(field),
                    error: (err) => reject(err)
                })
            });
        } else {
            dateTime = getTime(moment());
            if (field === 'endTime') {
                dateTime.add(1, 'hour');
            }
        }

        await this.updateNoteData({[field]: moment(dateTime).startOf("minute")});

        if (
            this.props.settings.defaultNotification &&
            !this.state.isNotificationWasUnchecked
        ) {
            this.updateNoteData({isNotificationEnabled: true});
        }
    }

    resetTime = (field) => {
        let isNotificationEnabled = this.state.note.isNotificationEnabled;
        if (field === 'startTime') {
            isNotificationEnabled = false;
            this.updateNoteData({
                startTime: null,
                endTime: null,
                isNotificationEnabled
            });
        } else {
            this.updateNoteData({[field]: null});
        }
    }

    onCalendarPeriodChange = (periodName) => {
        this.setState({
            calendarPeriod: {
                month: periodName.month,
                year: periodName.year
            }
        });
    }

    onDateSet = async (date) => {
        await this.updateNoteData({date: moment(date)});
        await this.setState({calendarValue: moment(date)})
        if (this.state.note.repeatType === NoteRepeatType.NoRepeat) {
            this.setState({
                busyTimePeriods: await this.getBusyTimePeriods()
            });
        }
    }

    onRepeatTypeChange = async (data) => {
        await this.updateNoteData({
            repeatType: data.repeatType,
            repeatValues: data.repeatValues,
            date: data.repeatType === NoteRepeatType.NoRepeat ? moment(this.state.calendarValue) : null
        });
    }

    updateNoteData = async (nextData) => {
        await new Promise((resolve) => {
            this.setState({
                note: {
                    ...this.state.note,
                    ...nextData
                }
            }, resolve);
        });
    }

    onContentWrapperClick = (e) => {
        if (e.target.classList.contains("add-content-wrapper")) {
            if (this.state.note.contentItems.length > 0) {
                this.focusDynamicField(this.state.note.contentItems.length - 1);
            }
        }
    }

    getExistingPeriodCrossedWithCurrent = () => {
        return this.state.busyTimePeriods
            .find((period) => (
                ((period[0].isSameOrBefore(this.state.note.startTime)) && (period[1].isSameOrAfter(this.state.note.startTime)))
                || (this.state.note.endTime && (period[0].isSameOrBefore(this.state.note.endTime)) && (period[1].isSameOrAfter(this.state.note.endTime)))
                || ((period[0].isSameOrAfter(this.state.note.startTime)) && this.state.note.endTime && (period[1].isSameOrBefore(this.state.note.endTime)))
            ));
    }

    selectNoteUpdateType = async () => {
        this.setState({
            isSaveTypeModalVisible: true
        });
        let repeatNoteUpdateType = await new Promise((resolve) => this.saveTypeSelectResolve = resolve);
        this.setState({
            isSaveTypeModalVisible: false
        });
        this.saveTypeSelectResolve = null;

        return repeatNoteUpdateType;
    }

    render() {
        let {t} = this.props;

        return (
            <div className="add-wrapper page-wrapper">
                <Header
                    noBorderRadius={this.state.isCalendarOpen}
                    buttons={[
                        ...(
                            (
                                (this.props.settings.notesScreenMode === NotesScreenMode.WithDateTime)
                                && (this.state.note.repeatType === NoteRepeatType.NoRepeat)
                            ) ?
                                [{
                                    action: this.triggerCalendar,
                                    img: CalendarImg
                                }] : []
                        ),
                        {
                            action: this.submit,
                            img: CheckedImg
                        }
                    ]}
                    title={(this.props.settings.notesScreenMode === NotesScreenMode.WithDateTime) && this.state.calendarValue && this.state.calendarValue.format('DD MMMM YYYY')}
                />
                {
                    this.state.isCalendarOpen &&
                    <React.Fragment>
                        {
                            this.state.calendarPeriod &&
                            <div className="calendar-period theme-header-background">{this.state.calendarPeriod.month} {this.state.calendarPeriod.year}</div>
                        }

                        <Calendar
                            currentDate={this.state.calendarValue}
                            calendarNotesCounterMode={this.props.settings.calendarNotesCounterMode}
                            onDateSet={this.onDateSet}
                            onCloseRequest={this.triggerCalendar}
                            onPeriodChange={this.onCalendarPeriodChange}
                        />
                    </React.Fragment>
                }
                <div className="page-content">
                    <div
                        className="add-content-wrapper"
                        onClick={this.onContentWrapperClick}
                    >
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
                                            onChange={(value, e) => this.updateNoteContentItem(i, {value}, e)}
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
                                } else if (contentItem.type === NoteContentItemType.Image) {
                                    return (
                                        <RemovableImage 
                                            key={i}
                                            className="add-content-item dynamic-field"
                                            src={contentItem.value}
                                            onClick={this.showImage}
                                            onRemove={() => this.removeContentItem(i)}
                                        />
                                    )
                                }
                                return null;
                            })
                        }
                    </div>
                    <div className="note-actions-wrapper">
                        <div className="content-items-actions-wrapper">
                            <div className="label c-gray">{t("add-content-item")}:</div>
                            <div className="content-items-actions">
                                <button
                                    onTouchStart={this.saveFocusedElement}
                                    onClick={this.addInputContentItem}
                                >
                                    <img
                                        src={TextImg}
                                        alt={t("list-item-btn")}
                                    />
                                </button>

                                <button
                                    onTouchStart={this.saveFocusedElement}
                                    onClick={this.addListItemContentItem}
                                >
                                    <img
                                        src={ListImg}
                                        alt={t("field-btn")}
                                    />
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
                                                src={ImageImg}
                                                alt="cam"
                                            />
                                        </button>
                                    )}
                                >
                                    <ButtonListItem
                                        className="no-border"
                                        text={t("open-galery")}
                                        onClick={() => {
                                            this.addImage(window.navigator.camera.PictureSourceType.SAVEDPHOTOALBUM);
                                            this.photoModal.trigger();
                                        }}
                                    />

                                    <ButtonListItem
                                        className="no-border"
                                        text={t("make-shot")}
                                        onClick={() => {
                                            this.addImage(window.navigator.camera.PictureSourceType.CAMERA);
                                            this.photoModal.trigger();
                                        }}
                                    />
                                </ModalListItem>
                            </div>
                        </div>

                        <div className="note-settings-wrapper hide-with-active-keyboard">
                            {
                                this.props.settings.notesScreenMode === NotesScreenMode.WithDateTime &&
                                <div className="notification-settings">
                                    <div className="repeat-set-wrapper">
                                        <button
                                            className="text img-text-button clear c-gray"
                                            onClick={() => this.setState({isRepeatTypeSelectModalOpen: !this.state.isRepeatTypeSelectModalOpen})}
                                        >
                                            <img
                                                src={RepeatImg}
                                                alt="repeat"
                                            />
                                            {t(NoteRepeatType.toTranslateId(this.state.note.repeatType))}
                                        </button>

                                        <RepeatTypeSelectModal
                                            isOpen={this.state.isRepeatTypeSelectModalOpen}
                                            defaultDate={moment(this.state.calendarValue)}
                                            repeatType={this.state.note.repeatType}
                                            repeatValues={this.state.note.repeatValues}
                                            calendarNotesCounterMode={this.props.settings.calendarNotesCounterMode}
                                            onSubmit={async (data) => {
                                                await this.onRepeatTypeChange(data);

                                                if (this.state.isCalendarOpen) {
                                                    this.setState({
                                                        isCalendarOpen: false
                                                    });
                                                }
                                            }}
                                            onRequestClose={() => this.setState({isRepeatTypeSelectModalOpen: false})}
                                        />
                                    </div>
                                    <div className="flex flex-align-center">
                                        <div className="time-set-wrapper">
                                            <button
                                                className="text img-text-button clear"
                                                onClick={() => {
                                                    if (this.state.note.startTime) {
                                                        this.resetTime('startTime');
                                                    } else {
                                                        this.pickTime('startTime');
                                                    }
                                                }}
                                            >
                                                <img
                                                    src={ClockImg}
                                                    alt="time"
                                                />
                                                {this.state.note.startTime && this.state.note.startTime.format('HH:mm')}
                                            </button>

                                            {
                                                this.state.note.startTime &&
                                                <Fragment>
                                                    <span className="separator">-</span>
                                                    <button
                                                        className="text img-text-button clear"
                                                        onClick={() => {
                                                            if (this.state.note.endTime) {
                                                                this.resetTime('endTime');
                                                            } else {
                                                                this.pickTime('endTime');
                                                            }
                                                        }}
                                                    >
                                                        <img
                                                            className={this.state.note.endTime ? "" : "m-0"}
                                                            src={ClockImg}
                                                            alt="time"
                                                        />
                                                        {this.state.note.endTime && this.state.note.endTime.format('HH:mm')}
                                                    </button>
                                                </Fragment>
                                            }
                                        </div>

                                        <div className="notification-switch-wrapper">
                                            <img
                                                src={NotificationImg}
                                                alt="notification"
                                            />

                                            <Switch
                                                checked={this.state.note.isNotificationEnabled}
                                                disabled={!this.state.note.startTime}
                                                clickEventWhileDisabled={true}
                                                onChange={this.onNotificationStateChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            }

                            {
                                this.getExistingPeriodCrossedWithCurrent() &&
                                <div className="busy-period-notification">
                                    <img
                                        src={WarningImg}
                                        alt="info"
                                    />
                                    {t("busy-period-notification")} {this.getExistingPeriodCrossedWithCurrent()[0].format("HH:MM")} - {this.getExistingPeriodCrossedWithCurrent()[1].format("HH:MM")}
                                </div>
                            }

                            <div className="color-picker-wrapper">
                                <ColorPicker
                                    onSelect={(e) => this.updateNoteData({tag: ColorTags[e.index]})}
                                    value={this.state.note.tag}
                                    colors={ColorTags}
                                />
                            </div>

                            {
                                this.props.tags.length !== 0 &&
                                <div className="tag-picker-wrapper">
                                    <TagList
                                        tags={this.props.tags}
                                        activeTags={this.state.note.tags.map((tag) => tag.id)}
                                        onActiveTagsChange={(tags) => this.updateNoteData({tags})}
                                    />
                                </div>
                            }
                        </div>
                    </div>
                </div>

                <Modal
                    isOpen={this.state.isSaveTypeModalVisible}
                    onRequestClose={() => this.saveTypeSelectResolve(null)}
                >
                    <ButtonListItem
                        className="no-border"
                        text={t("repeat-note-save-type-current")}
                        onClick={() => this.saveTypeSelectResolve(NoteUpdateType.REPEAT_CURRENT)}
                    />
                    <ButtonListItem
                        className="no-border"
                        text={t("repeat-note-save-type-all")}
                        onClick={() => this.saveTypeSelectResolve(NoteUpdateType.REPEAT_ALL)}
                    />
                </Modal>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        date: state.date,
        settings: state.settings,
        tags: state.tags
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(Add));