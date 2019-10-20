import React, {PureComponent} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import moment from "moment";
import ReactSwipe from 'react-swipe';
import {translate} from "react-i18next";

import FastAdd from '../../components/FastAdd/FastAdd';
import LightCalendar from '../../components/Calendar/LightCalendar/LightCalendar';
import Calendar from '../../components/Calendar/Calendar/Calendar';
import Header from '../../components/Header/Header';
import Fab from '../../components/Fab/Fab';
import NotesList from "./NotesList";

import * as AppActions from '../../actions'; 

import sliderChangeSide from "../../utils/sliderChangeSide";
import deepCopyObject from "../../utils/deepCopyObject";

import './Notes.scss';

class Notes extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            copyBuffer: null,
            isListItemDialogVisible: false,
            listItemDialogData: null,
            isSwipeAvailable: true,
        };

        this.activePageIndex = 1;  
        this.prevPageIndex = 1;
        this.slideChanged = false;
    }

    componentWillUpdate(nextProps, nextState) {
        if (this.swipe && (nextState.isSwipeAvailable !== this.props.isSwipeAvailable)) {
            this.swipe.disableScrolling(!nextState.isSwipeAvailable);
        }
    }

    onSlideChange = async ({index, nextIndex, side}) => {
        if (side === "left") {    
            let nextDate = moment(this.props.currentDate).add(-1, "day");
            this.props.updateDatesAndNotes(
                nextDate,
                moment(nextDate).add(-1, "day"),
                nextIndex,
                this.props.settings.notesScreenMode
            );
        } else {   
            let nextDate = moment(this.props.currentDate).add(1, "day");
            this.props.updateDatesAndNotes(
                nextDate,
                moment(nextDate).add(1, "day"),
                nextIndex,
                this.props.settings.notesScreenMode
            );
        }
    };

    setDate = (date) => {
        if (this.props.settings.notesScreenMode === 2) {
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

    onTodaySelect = () => {
        this.setDate(moment().startOf("day"));
    };

    pasteCopy = async () => {
        let note = deepCopyObject(Object.assign(this.state.copyBuffer, {
            repeatType: "no-repeat",
            added: moment(this.props.currentDate),
            forkFrom: -1,
            isShadow: false
        }));

        await this.props.addNote(note);
        
        this.setState({
            copyBuffer: null
        });
    };

    onNoteCopyRequest = (data) => {
        this.setState({
            copyBuffer: data
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

    render() {
        let {t} = this.props;

        return (
            <div className="page-wrapper">
                <Header
                    page={(this.props.settings.notesScreenMode === 1) ? "daily-notes" : "notes"}
                    onCalendarRequest={this.triggerCalendar}
                    onSelectToday={this.onTodaySelect}
                    onSearchMode={this.triggerSearchMode}
                />
                <div className="notes-list-wrapper page-content">
                    {   
                        (this.props.settings.notesScreenMode === 1) && (this.props.settings.calendarMode === 1) &&
                        <LightCalendar
                            calendarNotesCounter={this.props.settings.calendarNotesCounter}                            
                            currentDate={this.props.currentDate}
                            onDateSet={this.setDate}
                        />
                    }
                    {
                        (this.props.settings.notesScreenMode === 1) && (this.props.settings.calendarMode === 2) &&
                        <Calendar 
                            currentDate={this.props.currentDate}
                            calendarNotesCounter={this.props.settings.calendarNotesCounter}                            
                            onDateSet={this.setDate}
                            onCloseRequest={this.triggerCalendar}
                        />
                    }
                    {
                        (this.props.settings.notesScreenMode === 2) &&
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
                                    />
                                </div>
                            </div>
                        </div>
                    }
                    {
                        (this.props.settings.notesScreenMode === 1) &&
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
                                            onNoteCopyRequest={this.onNoteCopyRequest}
                                        />
                                    </div>
                                ))
                            }
                        </ReactSwipe>
                    }

                    {
                        this.state.copyBuffer && 
                        <Fab onClick={this.pasteCopy} />
                    }

                    {
                        this.props.settings.fastAdd &&
                        <FastAdd currentDate={this.props.currentDate} />
                    }
                </div>
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
        search: state.search
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(Notes));

function sort (data, settings) {
    let notesCompareFn = getNotesCompareFn();

    return data.map((list) => {
        list.items.sort((a, b) => notesCompareFn(a, b));
        if (settings.sortIncludePriority) {
            list.items.sort((a, b) => b.priority - a.priority);
        }
        return list;
    });

    function getNotesCompareFn() {
        if (settings.sortType === 0) {
            if (settings.notesScreenMode === 1) {
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
                if (settings.sortDirection === 1) {
                    return (a, b) => a.key - b.key
                } else {
                    return (a, b) =>  b.key - a.key
                }
            }
        }

        if (settings.sortType === 1) {
            if (settings.sortDirection === 1) {
                return (a, b) => a.key - b.key
            } else {
                return (a, b) =>  b.key - a.key
            }
        }

        if (settings.sortType === 2) {
            return (a, b) => {
                let aManualOrderIndex = (a.manualOrderIndex !== undefined && a.manualOrderIndex !== null) ? a.manualOrderIndex : 999;
                let bManualOrderIndex = (b.manualOrderIndex !== undefined && b.manualOrderIndex !== null) ? b.manualOrderIndex : 999;
                if (aManualOrderIndex === bManualOrderIndex) {
                    if (settings.sortDirection === 1) {
                        return a.key - b.key;
                    } else {
                        return b.key - a.key;
                    }
                }
                if (settings.sortDirection === 1) {
                    return aManualOrderIndex - bManualOrderIndex;
                } else {
                    return bManualOrderIndex - aManualOrderIndex;
                }
            }
        }
    }
}
