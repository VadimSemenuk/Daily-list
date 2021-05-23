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

import './Notes.scss';

class Notes extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            todayDate: moment(),
        };

        this.scrollToNote = null;
    }

    componentDidMount() {
        this.setupSidenav();
    }

    componentDidUpdate(prevProps) {
        if (
            this.scrollToNote !== null
            &&
            (
                (this.notesListSwipableRef && prevProps.notes[this.notesListSwipableRef.activePageIndex].items !== this.props.notes[this.notesListSwipableRef.activePageIndex].items)
                ||
                (this.props.settings.notesScreenMode === NotesScreenMode.WithoutDateTime)
            )
        ) {
            let el = document.querySelector(`[data-id='${this.scrollToNote}']`);
            el && el.scrollIntoView();

            this.scrollToNote = null;
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

    onSlideChange = async (side, nextIndex) => {
        let changeValue = 1;
        if (side === "left") {
            changeValue = -1;
        }

        let nextDate = moment(this.props.currentDate).add(changeValue, "day");
        let nextPreRenderDate = [moment(nextDate).add(changeValue, "day")];
        this.props.updateDatesAndNotes(nextDate, nextPreRenderDate, nextIndex, this.props.settings.notesScreenMode);
    };

    setDate = (date) => {
        if (this.props.settings.notesScreenMode === NotesScreenMode.WithoutDateTime) {
            return;
        }

        let cur = moment(date).startOf("day");
        let prev = moment(cur).add(-1, "day");
        let next = moment(cur).add(1, "day");

        if (this.notesListSwipableRef.activePageIndex === 2) {
            this.props.setDatesAndUpdateNotes([next, prev, cur], 2, this.props.settings.notesScreenMode);
        } else if (this.notesListSwipableRef.activePageIndex === 0) {
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

export default connect(mapStateToProps, mapDispatchToProps)(Notes);

function sort (data, settings) {
    let notesCompareFn = getNotesCompareFn(settings);

    return data.map((list) => {
        list.items.sort((a, b) => notesCompareFn(a, b));
        return list;
    });
}

function getNotesCompareFn(settings) {
    if (settings.sortType === SortType.TimeSort) {
        if (settings.notesScreenMode === NotesScreenMode.WithDateTime) {
            return (a, b) => {
                let aDayTimeSum = a.startTime ?
                    (a.startTime.valueOf() - moment(a.startTime).startOf('day').valueOf())
                    : 0;
                let bDayTimeSum = b.startTime ?
                    (b.startTime.valueOf() - moment(b.startTime).startOf('day').valueOf())
                    : 0;

                if (settings.sortDirection === SortDirectionType.ASC) {
                    return aDayTimeSum - bDayTimeSum;
                } else {
                    return bDayTimeSum - aDayTimeSum;
                }
            };
        } else {
            return getSortByAddedTimeFn(settings);
        }
    } else if (settings.sortType === SortType.TimeAddSort) {
        return getSortByAddedTimeFn(settings);
    } else if (settings.sortType === SortType.CustomSort) {
        return (a, b) => {
            let aManualOrderIndex = (a.manualOrderIndex !== null) ? a.manualOrderIndex : 999;
            let bManualOrderIndex = (a.manualOrderIndex !== null) ? b.manualOrderIndex : 999;
            if (aManualOrderIndex === bManualOrderIndex) {
                return getSortByAddedTimeFn(settings)(a, b);
            }
            return aManualOrderIndex - bManualOrderIndex;
        }
    }
}

function getSortByAddedTimeFn(settings) {
    if (settings.sortDirection === SortDirectionType.ASC) {
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