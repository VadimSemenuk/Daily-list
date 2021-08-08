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

import * as AppActions from '../../actions'; 

import {NotesScreenMode, SortDirectionType, SortType} from "../../constants";

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
            scrollToNote: null
        };
    }

    componentDidMount() {
        this.setupSidenav();
    }

    componentDidUpdate() {
        if (this.state.scrollToNote) {
            let el = document.querySelector(`[data-id='${this.state.scrollToNote}']`);
            el && el.scrollIntoView();

            this.setState({
                scrollToNote: null
            });
        }
    }

    setNotesListSwipableRef = (ref) => {
        this.notesListSwipableRef = ref;
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
        let dates = [moment(msCurDate).add(-1, "day"), msCurDate, moment(msCurDate).add(1, "day")];
        this.props.setDatesAndUpdateNotes(dates, 1, mode);
    }

    onSlideChange = async (side, nextIndex) => {
        let changeValue = 1;
        if (side === "left") {
            changeValue = -1;
        }

        let nextDate = moment(this.props.currentDate).add(changeValue, "day");
        let nextPreRenderDate = [moment(nextDate).add(changeValue, "day")];
        this.props.updateDatesAndNotes(nextDate, nextPreRenderDate, nextIndex, this.props.settings.notesScreenMode);
    };

    setDate = async (date) => {
        if (this.props.settings.notesScreenMode === NotesScreenMode.WithoutDateTime) {
            return;
        }

        let cur = moment(date).startOf("day");
        let prev = moment(cur).add(-1, "day");
        let next = moment(cur).add(1, "day");

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
            this.setState({
                scrollToNote: note.id
            });
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

                            <NotesActionsHandlerWrapper
                                listRef={this.setNotesListSwipableRef}
                                List={NotesListSwipable}
                                notes={this.props.notes}
                                settings={this.props.settings}
                                onSlideChange={this.onSlideChange}
                            />
                        </React.Fragment>
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
            </div>
        )
    }
}

function mapStateToProps(state) {
    let notes = state.notes.slice((list) => ({...list, items: list.items.slice()}));

    filter(notes, state.settings);

    sort(notes, state.settings);

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

function filter(data, settings) {
    if (settings.noteFilters.tags.length) {
        data.forEach((list) => {
            list.items.forEach((note) => {
                note.isVisible = note.tags.filter((tag) => settings.noteFilters.tags.filter((tagId) => tagId === tag.id).length !== 0).length !== 0;
            });
        });
    } else {
        data.forEach((list) => {
            list.items.forEach((note) => {
                note.isVisible = true;
            });
        });
    }
}

function sort(data, settings) {
    let notesCompareFn = getNotesCompareFn(settings);
    data.forEach((list) => list.items.sort(notesCompareFn));
}

function getNotesCompareFn(settings) {
    if (settings.notesScreenMode === NotesScreenMode.WithDateTime && settings.sortType === SortType.TimeSort) {
        return (a, b) => {
            let aVal = a.startTime ? (a.startTime.valueOf() - moment(a.startTime).startOf('day').valueOf()) : 0;
            let bVal = b.startTime ? (b.startTime.valueOf() - moment(b.startTime).startOf('day').valueOf()) : 0;

            return settings.sortDirection === SortDirectionType.ASC ? aVal - bVal : bVal - aVal;
        };
    } else {
        return (a, b) => {
            if (a.manualOrderIndex === null || b.manualOrderIndex === null) {
                let aVal = a.forkFrom !== null ? a.forkFrom : a.id;
                let bVal = b.forkFrom !== null ? b.forkFrom : b.id;

                return settings.sortDirection === SortDirectionType.ASC ? aVal - bVal : bVal - aVal;
            } else {
                return a.manualOrderIndex - b.manualOrderIndex;
            }
        }
    }
}