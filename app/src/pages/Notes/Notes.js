import React, {PureComponent} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import moment from "moment";
import ReactSwipe from 'react-swipe';
import {translate} from "react-i18next";

import LightCalendar from '../../components/Calendar/LightCalendar/LightCalendar';
import Calendar from '../../components/Calendar/Calendar/Calendar';
import Header from '../../components/Header/Header';
import Fab from '../../components/Fab/Fab';
import NotesList from "./NotesList";
import Modal from "../../components/Modal/Modal";
import {ButtonListItem} from "../../components/ListItem/ListItem";

import * as AppActions from '../../actions'; 

import sliderChangeSide from "../../utils/sliderChangeSide";
import deepCopyObject from "../../utils/deepCopyObject";

import {NoteRepeatType, NotesScreenMode} from "../../constants";

import './Notes.scss';
import AddImg from "../../assets/img/add.svg";
import ExportImg from "../../assets/img/upload-to-cloud.svg";
import SearchImg from "../../assets/img/search.svg";
import ChevronBottomImg from "../../assets/img/bottom-chevron.svg";
import MenuImg from "../../assets/img/menu.svg";
import SettingsImg from "../../assets/img/settings-black.svg";
import UserImg from "../../assets/img/user.svg";
import DeleteImg from "../../assets/img/delete.svg";
import InfoImg from "../../assets/img/info.svg";
import CalendarImg from "../../assets/img/calendar-black.svg";
import ListImg from "../../assets/img/list.svg";

class Notes extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            copyBuffer: null,
            isListItemDialogVisible: false,
            listItemDialogData: null,
            isSwipeAvailable: true,
            todayDate: moment(),
        };

        this.activePageIndex = 1;  
        this.prevPageIndex = 1;
        this.slideChanged = false;

        this.scrollToNote = null;
    }

    componentWillUpdate(nextProps, nextState) {
        if (this.swipe && (nextState.isSwipeAvailable !== this.props.isSwipeAvailable)) {
            this.swipe.disableScrolling(!nextState.isSwipeAvailable);
        }
        if (nextProps.settings.notesScreenMode !== this.props.settings.notesScreenMode) {
            this.activePageIndex = 1;
            this.prevPageIndex = 1;
            this.slideChanged = false;
            this.setState({
                isSwipeAvailable: true
            });
        }
    }

    componentDidMount() {
        this.setupSidenav();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (
            this.scrollToNote !== null
            && prevProps.notes[this.activePageIndex].items !== this.props.notes[this.activePageIndex].items
        ) {
            let el = document.querySelector(`[data-id='${this.scrollToNote}']`);
            el && el.scrollIntoView();

            this.scrollToNote = null;
        }
    }

    setupSidenav() {
        this.props.setSidenavItems([
            [
                {
                    textId: "show-daily-notes-screen",
                    action: async () => {
                        await this.setScreenMode(NotesScreenMode.WithDateTime);
                        this.setupSidenav();
                    },
                    isActive: this.props.settings.notesScreenMode === NotesScreenMode.WithDateTime,
                    img: CalendarImg
                },
                {
                    textId: "show-notes-screen",
                    action: async () => {
                        await this.setScreenMode(NotesScreenMode.WithoutDateTime);
                        this.setupSidenav();
                    },
                    isActive: this.props.settings.notesScreenMode === NotesScreenMode.WithoutDateTime,
                    img: ListImg
                }
            ],
            [
                {
                    textId: "settings",
                    action: () => this.props.history.push("/settings"),
                    img: SettingsImg
                },
                {
                    textId: "account",
                    action: () => this.props.history.push("/backup"),
                    img: UserImg
                },
                {
                    textId: "trash",
                    action: () => this.props.history.push("/trash"),
                    img: DeleteImg
                },
                {
                    textId: "about",
                    action: () => this.props.history.push("/about"),
                    img: InfoImg
                }
            ]
        ]);
    }

    async setScreenMode(mode) {
        await this.props.setSetting("notesScreenMode", mode);

        let msCurDate = moment().startOf("day");
        let dates = [moment(msCurDate).add(-1, "day"), msCurDate, moment(msCurDate).add(1, "day")];
        this.props.setDatesAndUpdateNotes(dates, 1, mode);
    }

    onSlideChange = async ({index, nextIndex, side}) => {
        if (side === "left") {
            let nextDate = moment(this.props.currentDate).add(-1, "day");
            this.props.updateDatesAndNotes(
                nextDate,
                [moment(nextDate).add(-1, "day")],
                nextIndex,
                this.props.settings.notesScreenMode
            );
        } else {   
            let nextDate = moment(this.props.currentDate).add(1, "day");
            this.props.updateDatesAndNotes(
                nextDate,
                [moment(nextDate).add(1, "day")],
                nextIndex,
                this.props.settings.notesScreenMode
            );
        }
    };

    setDate = (date) => {
        if (this.props.settings.notesScreenMode === NotesScreenMode.WithoutDateTime) {
            return;
        }

        let cur = moment(date).startOf("day");
        let prev = moment(cur).add(-1, "day");
        let next = moment(cur).add(1, "day");

        if (this.activePageIndex === 2) {
            this.props.setDatesAndUpdateNotes([next, prev, cur], 2, this.props.settings.notesScreenMode);
        } else if (this.activePageIndex === 0) {
            this.props.setDatesAndUpdateNotes([cur, next, prev], 0, this.props.settings.notesScreenMode);
        } else {
            this.props.setDatesAndUpdateNotes([prev, cur, next], 1, this.props.settings.notesScreenMode);
        }
    };

    triggerCalendar = () => {
        this.props.setSetting('calendarMode', this.props.settings.calendarMode === 1 ? 2 : 1);
    };

    onHeaderDateViewClick = () => {
        this.setDate(moment().startOf("day"));
    };

    onNoteChange = (itemData, updatedState) => {
        this.props.updateNoteDynamic(itemData, updatedState);
    }

    onDialogRequest = (data) => {
        this.openDialog(data);
    }

    openDialog = (data) => {
        this.setState({
            isListItemDialogVisible: true,
            listItemDialogData: {note: data}
        });
    };

    closeDialog = () => {
        this.setState({
            isListItemDialogVisible: false,
            listItemDialogData: null
        });
    };

    onEditRequest = () => {
        this.closeDialog();

        this.props.history.push({
            pathname: "/edit",
            state: { note: this.state.listItemDialogData.note }
        });
    };

    onListItemRemove = () => {
        this.closeDialog();

        this.props.deleteNote(this.state.listItemDialogData.note);
    };

    pasteCopy = async () => {
        let note = deepCopyObject(Object.assign(this.state.copyBuffer, {
            repeatType: NoteRepeatType.NoRepeat,
            date: moment(this.props.currentDate)
        }));

        await this.props.addNote(note);
        
        this.setState({
            copyBuffer: null
        });
    };

    onNoteCopyRequest = () => {
        this.closeDialog();

        this.setState({
            copyBuffer: this.state.listItemDialogData.note
        });
    };

    onDragSortModeTrigger = (value) => {
        this.setState({
            isSwipeAvailable: !value
        });
    };

    onOrderChange = (order) => {
        this.props.updateNotesManualSortIndex(order);
    };

    onSearchResult = (note) => {
        if (!note) {
            return;
        }

        this.scrollToNote = note.id;
        if (note.date.valueOf() !== this.props.currentDate.valueOf()) {
            this.setDate(note.date);
        }
    }

    render() {
        let {t} = this.props;

        return (
            <div className="page-wrapper">
                <Header
                    leftButtons={[
                        {
                            action: () => this.props.triggerSidenav(),
                            img: MenuImg
                        }
                    ]}
                    buttons={[
                        {
                            action: () => {
                                this.props.history.push({
                                    pathname: "/search",
                                    state: { onResult: this.onSearchResult }
                                });
                            },
                            img: SearchImg
                        },
                        ...(
                            this.props.user ?
                                [{
                                    action: () => this.props.uploadGDBackup("user"),
                                    img: ExportImg
                                }] : []
                        ),
                        {
                            link: "/add",
                            img: AddImg
                        }
                    ]}
                    isBackButtonVisible={false}
                    isDateViewVisible={true}
                    dateViewValue={this.state.todayDate}
                    onDateViewClick={this.onHeaderDateViewClick}
                />
                <div className="notes-list-wrapper page-content">
                    {
                        this.props.settings.notesScreenMode === NotesScreenMode.WithDateTime &&
                        <React.Fragment>
                            {
                                this.props.settings.calendarMode === 1 &&
                                <LightCalendar
                                    calendarNotesCounterMode={this.props.settings.calendarNotesCounterMode}
                                    currentDate={this.props.currentDate}
                                    onDateSet={this.setDate}
                                />
                            }
                            {
                                this.props.settings.calendarMode === 2 &&
                                <Calendar
                                    currentDate={this.props.currentDate}
                                    calendarNotesCounterMode={this.props.settings.calendarNotesCounterMode}
                                    onDateSet={this.setDate}
                                    onCloseRequest={this.triggerCalendar}
                                />
                            }

                            <div className="calendar-trigger-wrapper theme-header-background">
                                <div
                                    className="calendar-trigger calendar-trigger"
                                    onClick={this.triggerCalendar}
                                >
                                    <img
                                        className={this.props.settings.calendarMode === 2 ? ' rotated' : ''}
                                        src={ChevronBottomImg}
                                        alt="trigger"
                                    />
                                </div>
                            </div>

                            <ReactSwipe
                                ref={node => {
                                    if (node) {
                                        this.swipe = node.swipe;
                                    }
                                }}
                                className="notes-list-swiper"
                                swipeOptions={{
                                    continuous: true,
                                    startSlide: 1,
                                    callback: this.onSliderChange,
                                    transitionEnd: this.onTransitionEnd,
                                    disableScroll: !this.state.isSwipeAvailable,
                                }}
                                key={this.props.notes.length}
                            >
                                {
                                    this.props.notes.map((notes, i) => (
                                        <div
                                            className="notes-list-item-wrapper"
                                            key={i}
                                        >
                                            <NotesList
                                                index={i}
                                                notes={notes.items}
                                                settings={this.props.settings}
                                                onDragSortModeTrigger={this.onDragSortModeTrigger}
                                                onOrderChange={this.onOrderChange}
                                                onNoteChange={this.onNoteChange}
                                                onDialogRequest={this.onDialogRequest}
                                            />
                                        </div>
                                    ))
                                }
                            </ReactSwipe>
                        </React.Fragment>
                    }
                    {
                        (this.props.settings.notesScreenMode === NotesScreenMode.WithoutDateTime) &&
                        <div className="notes-list-swiper">
                            <div>
                                <div
                                    className="notes-list-item-wrapper"
                                    style={{width: '100%'}}
                                >
                                    <NotesList
                                        index={0}
                                        notes={this.props.notes[0].items}
                                        settings={this.props.settings}
                                        onDragSortModeTrigger={this.onDragSortModeTrigger}
                                        onOrderChange={this.onOrderChange}
                                        onNoteChange={this.onNoteChange}
                                        onDialogRequest={this.onDialogRequest}
                                    />
                                </div>
                            </div>
                        </div>
                    }

                    {
                        this.state.copyBuffer && 
                        <Fab onClick={this.pasteCopy} />
                    }
                </div>

                <Modal
                    isOpen={this.state.isListItemDialogVisible}
                    onRequestClose={this.closeDialog}
                >
                    <ButtonListItem
                        className="no-border"
                        text={t("edit")}
                        onClick={this.onEditRequest}
                    />
                    <ButtonListItem
                        className="no-border"
                        text={t("delete")}
                        onClick={this.onListItemRemove}
                    />
                    <ButtonListItem
                        className="no-border"
                        text={t("do-copy")}
                        onClick={this.onNoteCopyRequest}
                    />
                </Modal>
            </div>
        )
    }

    onTransitionEnd = (a) => {
        if (this.slideChanged) {
            let listEls = document.querySelectorAll(".notes-list-item-wrapper");
            for (let i = 0; i < listEls.length; i++) {
                listEls[i].scrollTop = 0
            }

            let activeItemsEls = document.querySelectorAll(".note-wrapper.expanded:not(.force-expanded)");
            for (let i = 0; i < activeItemsEls.length; i++) {
                activeItemsEls[i].classList.remove("expanded");
            }

            this.slideChanged = false;
        }
    };

    onSliderChange = (e) => {
        this.slideChanged = true; 

        const action = sliderChangeSide(e, this.activePageIndex, this.prevPageIndex);
        this.prevPageIndex = action.prevPageIndex;
        this.activePageIndex = action.activePageIndex;

        this.onSlideChange(action);
    }
}

function mapStateToProps(state) {
    let notes = sort(state.notes, state.settings);

    return {
        notes,
        currentDate: state.date,
        settings: state.settings,
        search: state.search,
        user: state.user
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(Notes));

function sort (data, settings) {
    let notesCompareFn = getNotesCompareFn(settings);

    return data.map((list) => {
        list.items.sort((a, b) => notesCompareFn(a, b));
        return list;
    });
}

function getNotesCompareFn(settings) {
    if (settings.sortType === 0) {
        if (settings.notesScreenMode === NotesScreenMode.WithDateTime) {
            return (a, b) => {
                let aDayTimeSum = a.startTime ?
                    (a.startTime.valueOf() - moment(a.startTime).startOf('day').valueOf())
                    : 0;
                let bDayTimeSum = b.startTime ?
                    (b.startTime.valueOf() - moment(b.startTime).startOf('day').valueOf())
                    : 0;

                if (settings.sortDirection === 1) {
                    return aDayTimeSum - bDayTimeSum;
                } else {
                    return bDayTimeSum - aDayTimeSum;
                }
            };
        } else {
            return getSortByAddedTimeFn(settings);
        }
    }

    if (settings.sortType === 1) {
        return getSortByAddedTimeFn(settings);
    }

    if (settings.sortType === 2) {
        return (a, b) => {
            let aManualOrderIndex = (a.manualOrderIndex !== undefined && a.manualOrderIndex !== null) ? a.manualOrderIndex : 999;
            let bManualOrderIndex = (b.manualOrderIndex !== undefined && b.manualOrderIndex !== null) ? b.manualOrderIndex : 999;
            if (aManualOrderIndex === bManualOrderIndex) {
                return getSortByAddedTimeFn(settings)(a, b);
            }
            if (settings.sortDirection === 1) {
                return aManualOrderIndex - bManualOrderIndex;
            } else {
                return bManualOrderIndex - aManualOrderIndex;
            }
        }
    }
}

function getSortByAddedTimeFn(settings) {
    if (settings.sortDirection === 1) {
        return (a, b) => {
            let aVal = a.forkFrom !== null ? a.forkFrom : a.id;
            let bVal = b.forkFrom !== null ? b.forkFrom : b.id;
            return aVal - bVal;
        }
    } else {
        return (a, b) => {
            let aVal = a.forkFrom !== null ? a.forkFrom : a.id;
            let bVal = b.forkFrom !== null ? b.forkFrom : b.id;
            return bVal - aVal;
        }
    }
}