import React, {PureComponent} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import moment from "moment";

import LightCalendar from '../../components/Calendar/LightCalendar/LightCalendar';
import Calendar from '../../components/Calendar/Calendar/Calendar';
import Header from '../../components/Header/Header';
import NotesList from "./NotesList";
import NotesListSwipable from "./NotesListSwipable";
import NotesActionsHandlerWrapper from "./NotesActionsHandlerWrapper";
import QuickAdd from "../../components/QuickAdd/QuickAdd";

import * as AppActions from '../../actions'; 

import {NoteRepeatType, NotesScreenMode, SortDirectionType, SortType} from "../../constants";

import AddImg from "../../assets/img/add.svg";
import SearchImg from "../../assets/img/search.svg";
import ChevronBottomImg from "../../assets/img/bottom-chevron.svg";
import MenuImg from "../../assets/img/menu.svg";
import SettingsImg from "../../assets/img/settings-black.svg";
import DeleteImg from "../../assets/img/delete.svg";
import InfoImg from "../../assets/img/info.svg";
import CalendarImg from "../../assets/img/calendar-black.svg";
import ListImg from "../../assets/img/list.svg";
import TagImg from "../../assets/img/tag.svg";
import BackupImg from "../../assets/img/upload-to-cloud-black.svg";

import './Notes.scss';

class Notes extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            headerMultiFloorTitle: null,
        };
    }

    componentDidMount() {
        this.setupSidenav();

        if (window.cordova) {
            window.cordova.plugins.natives.addEventListener("addClick", this.onWidgetAddClick);
            window.cordova.plugins.natives.addEventListener("noteClick", this.onWidgetNoteClick);
            window.cordova.plugins.natives.addEventListener("noteStateChange", this.onWidgetStateChange);
        }
    }

    componentWillUnmount() {
        window.cordova.plugins.natives.removeEventListener(this.onWidgetAddClick);
        window.cordova.plugins.natives.removeEventListener(this.onWidgetNoteClick);
        window.cordova.plugins.natives.removeEventListener(this.onWidgetStateChange);
    }

    scrollToNote = (id) => {
        let el = document.querySelector(`[data-id='${id}']`);
        el && el.scrollIntoView();
    }

    expandNote = (id) => {
        let el = document.querySelector(`.note-wrapper[data-id='${id}'] .note`);
        el && el.classList.add("expanded");
    }

    onWidgetStateChange = () => {
        this.props.updateNotes();
        this.props.getFullCount();
    }

    onWidgetAddClick = async (props) => {
        if (props.type !== this.props.settings.notesScreenMode) {
            await this.setScreenMode(props.type);
            await this.setupSidenav();
        }

        setTimeout(() => {
            this.props.history.push({
                pathname: "/add",
                state: {
                    props: {
                        tagsSelected: this.props.settings.noteFilters.tags,
                        focusUsingPlugin: true
                    }
                }
            });
        });
    }

    onWidgetNoteClick = async (props) => {
        if (props.type !== this.props.settings.notesScreenMode) {
            await this.setScreenMode(props.type);
            await this.setupSidenav();
        } else if (!moment().startOf("day").isSame(this.props.currentDate)) {
            let today = moment().startOf("day");
            await this.setDate(today);
        }

        setTimeout(() => {
            this.scrollToNote(props.id);
            this.expandNote(props.id);
        });
    }

    setNotesListSwipableRef = (ref) => {
        this.notesListSwipableRef = ref;
    }

    async setupSidenav() {
        return this.props.setSidenavItems([
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
                },
                {
                    textId: "edit-tags",
                    action: () => this.props.history.push("/tags"),
                    img: TagImg,
                    showTags: true
                },
            ],
            [
                {
                    textId: "settings",
                    action: () => this.props.history.push("/settings"),
                    img: SettingsImg
                },
                {
                    textId: "tags",
                    action: () => this.props.history.push("/tags"),
                    img: TagImg
                },
                {
                    textId: "backup",
                    action: () => this.props.history.push("/backup"),
                    img: BackupImg
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
        await this.props.setSetting({notesScreenMode: mode});

        let msCurDate = moment().startOf("day");
        let dates = [moment(msCurDate).add(-1, "day").startOf("day"), msCurDate, moment(msCurDate).add(1, "day").startOf("day")];
        await this.props.setDatesAndUpdateNotes(dates, 1, mode);
    }

    onSlideChange = async (side, nextIndex) => {
        let changeValue = 1;
        if (side === "left") {
            changeValue = -1;
        }

        let nextDate = moment(this.props.currentDate).add(changeValue, "day").startOf("day");
        let nextPreRenderDate = [moment(nextDate).add(changeValue, "day").startOf("day")];
        this.props.updateDatesAndNotes(nextDate, nextPreRenderDate, nextIndex, this.props.settings.notesScreenMode);
    };

    setDate = async (date) => {
        if (this.props.settings.notesScreenMode === NotesScreenMode.WithoutDateTime) {
            return;
        }

        let cur = moment(date).startOf("day").startOf("day");
        let prev = moment(cur).add(-1, "day").startOf("day");
        let next = moment(cur).add(1, "day").startOf("day");

        if (this.notesListSwipableRef.activePageIndex === 2) {
            return this.props.setDatesAndUpdateNotes([next, prev, cur], 2, this.props.settings.notesScreenMode);
        } else if (this.notesListSwipableRef.activePageIndex === 0) {
            return this.props.setDatesAndUpdateNotes([cur, next, prev], 0, this.props.settings.notesScreenMode);
        } else {
            return this.props.setDatesAndUpdateNotes([prev, cur, next], 1, this.props.settings.notesScreenMode);
        }
    };

    triggerCalendar = () => {
        this.props.setSetting({calendarMode: this.props.settings.calendarMode === 1 ? 2 : 1});
    };

    setTodayDate = () => {
        this.setDate(moment().startOf("day"));
    };

    onSearchResult = async (note) => {
        if (!note) {
            return;
        }

        if (note.date.valueOf() !== this.props.currentDate.valueOf()) {
            await this.setDate(note.date);
        }

        setTimeout(() => {
            let noteId = note.id;

            if (note.repeatType !== NoteRepeatType.NoRepeat) {
                let list = this.props.notes.find((list) => list.date.isSame(note.date));
                let forkedNote = list.items.find((_note) => _note.forkFrom === note.forkFrom);

                if (forkedNote) {
                    noteId = forkedNote.id;
                }
            }

            this.scrollToNote(noteId)
        });
    }

    onCalendarPeriodChange = (periodName) => {
        this.setState({
            headerMultiFloorTitle: {
                top: periodName.month,
                bottom: periodName.year
            }
        });
    }

    render() {
        return (
            <div className="page-wrapper">
                <Header
                    noBorderRadius={this.props.settings.notesScreenMode === NotesScreenMode.WithDateTime}
                    leftButtons={[
                        {
                            action: () => this.props.triggerSidenav(),
                            img: MenuImg
                        }
                    ]}
                    buttons={[
                        {
                            action: () => this.props.history.push({
                                pathname: "/search",
                                state: { onResult: this.onSearchResult }
                            }),
                            img: SearchImg
                        },
                        {
                            action: () => this.props.history.push({
                                pathname: "/add",
                                state: {
                                    props: {
                                        tagsSelected: this.props.settings.noteFilters.tags
                                    }
                                }
                            }),
                            img: AddImg
                        }
                    ]}
                    isBackButtonVisible={false}
                    multiFloorTitle={this.props.settings.notesScreenMode === NotesScreenMode.WithDateTime ? this.state.headerMultiFloorTitle : null}
                    onMultiFloorTitleClick={this.setTodayDate}
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
                                    onPeriodChange={this.onCalendarPeriodChange}
                                />
                            }
                            {
                                this.props.settings.calendarMode === 2 &&
                                <Calendar
                                    currentDate={this.props.currentDate}
                                    calendarNotesCounterMode={this.props.settings.calendarNotesCounterMode}
                                    onDateSet={this.setDate}
                                    onCloseRequest={this.triggerCalendar}
                                    onPeriodChange={this.onCalendarPeriodChange}
                                />
                            }

                            <div className="calendar-trigger-wrapper theme-header-background">
                                <div
                                    className="calendar-trigger"
                                    onClick={this.triggerCalendar}
                                >
                                    <img
                                        className={this.props.settings.calendarMode === 2 ? 'rotated' : ''}
                                        src={ChevronBottomImg}
                                        alt="trigger"
                                    />
                                </div>
                            </div>
                        </React.Fragment>
                    }
                    {
                        (this.props.settings.isQuickAddPanelVisible && this.props.settings.invertHeaderPosition) &&
                        <QuickAdd/>
                    }
                    {
                        this.props.settings.notesScreenMode === NotesScreenMode.WithDateTime &&
                        <NotesActionsHandlerWrapper
                            listRef={this.setNotesListSwipableRef}
                            List={NotesListSwipable}
                            notes={this.props.notes}
                            settings={this.props.settings}
                            onSlideChange={this.onSlideChange}
                        />
                    }
                    {
                        (this.props.settings.notesScreenMode === NotesScreenMode.WithoutDateTime) &&
                        <div className="notes-list-without-time-wrapper">
                            <NotesActionsHandlerWrapper
                                List={NotesList}
                                notes={this.props.notes[0].items}
                                settings={this.props.settings}
                            />
                        </div>
                    }
                </div>

                {
                    (this.props.settings.isQuickAddPanelVisible && !this.props.settings.invertHeaderPosition) &&
                    <QuickAdd/>
                }
            </div>
        )
    }
}

function mapStateToProps(state) {
    let notes = state.notes.slice((list) => ({...list, items: list.items.slice()}));
    notes.forEach((list) => filter(list.items, state.settings));
    notes.forEach((list) => sort(list.items, state.settings));

    return {
        notes: notes,
        currentDate: state.date,
        settings: state.settings,
        search: state.search,
        user: state.user,
        tags: state.tags
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Notes);

function filter(items, settings) {
    if (settings.noteFilters.tags.length) {
        items.forEach((note) => {
            note.isVisible = note.tags.filter((tag) => settings.noteFilters.tags.filter((tagId) => tagId === tag.id).length !== 0).length !== 0;
        });
    } else {
        items.forEach((note) => {
            note.isVisible = true;
        });
    }
}

function sort(items, settings) {
    if (settings.notesScreenMode === NotesScreenMode.WithDateTime && settings.sortType === SortType.TimeSort) {
        items.sort((a, b) => {
            let aVal = a.startTime ? (a.startTime.valueOf() - moment(a.startTime).startOf('day').valueOf()) : 0;
            let bVal = b.startTime ? (b.startTime.valueOf() - moment(b.startTime).startOf('day').valueOf()) : 0;

            return settings.sortDirection === SortDirectionType.ASC ? aVal - bVal : bVal - aVal;
        });
    } else {
        items.sort((a, b) => {
            if (a.manualOrderIndex === null && b.manualOrderIndex === null) {
                let aVal = a.forkFrom !== null ? a.forkFrom : a.id;
                let bVal = b.forkFrom !== null ? b.forkFrom : b.id;

                return settings.sortDirection === SortDirectionType.ASC ? aVal - bVal : bVal - aVal;
            } else if (a.manualOrderIndex === null && b.manualOrderIndex !== null) {
                return 1;
            } else if (a.manualOrderIndex !== null && b.manualOrderIndex === null) {
                return -1;
            } else {
                return a.manualOrderIndex - b.manualOrderIndex;
            }
        });
    }
}