import React, {PureComponent} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import moment from "moment";
import ReactSwipe from 'react-swipe';
import {translate} from "react-i18next";
import scroll from "scroll";
import debounce from "debounce";

import FastAdd from '../../components/FastAdd/FastAdd';
import DayNotesList from './DayNotesList';
import WeekNotesList from './WeekNotesList';
import LightCalendar from '../../components/Calendar/LightCalendar/LightCalendar';
import Calendar from '../../components/Calendar/Calendar/Calendar';
import Header from '../../components/Header/Header';
import Modal from '../../components/Modal/Modal';
import Fab from '../../components/Fab/Fab';
import {ButtonListItem} from "../../components/ListItem/ListItem";

import * as AppActions from '../../actions'; 

import sliderChangeSide from "../../utils/sliderChangeSide";
import deepCopyObject from "../../utils/DeepCopyObject";

import './NotesList.scss';

class NotesList extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            imageViewer: {
				uri: '',
				isVisible: false
            },
            copyBuffer: null,
            listItemDialogVisible: false,
            calendar: false
        }

        this.activePageIndex = 1;  
        this.prevPageIndex = 1;
        this.slideChanged = false;
    }

    async componentDidMount() {
        if (this.props.settings.notesShowInterval === 0) {
            this.setScrollEvent();
        }
    }

    setScrollEvent() {
        let activeIndex = 0;
        let headers = document.querySelectorAll(".notes-list-item-wrapper")[1].querySelectorAll(".week-header");  

        let onScroll = debounce((e) => {        
            for (let i = 0; i < headers.length; i++) {
                if (headers[i].offsetTop === e.target.scrollTop) {
                    if (activeIndex !== i) {
                        onIndexChange(i);
                    }
                    break;
                }
            }
        }, 100)

        let onIndexChange = (i) => {
            activeIndex = i;
            this.props.setCurrentDate(moment(+headers[i].dataset.date));
        }
        
        document.querySelectorAll(".notes-list-item-wrapper")[1].addEventListener("scroll", onScroll);
    }

    onSlideChange = async ({index, nextIndex, side}) => {
        let updateFn, diff;
        if (this.props.settings.notesShowInterval === 0) {
            updateFn = this.props.updateWeekDatesAndNotes;
            diff = "week";
        } else {
            updateFn = this.props.updateDatesAndNotes;
            diff = "day";
        }

        if (side === "left") {    
            let nextDate = moment(this.props.currentDate).add(-1, diff);
            updateFn(
                nextDate,
                moment(nextDate).add(-1, diff),
                nextIndex
            )
        } else {   
            let nextDate = moment(this.props.currentDate).add(1, diff);
            updateFn(
                nextDate,
                moment(nextDate).add(1, diff),
                nextIndex            
            )     
        }
    }

    onItemActionsWindowRequest = (note) => {
        this.setState({
            listItemDialogVisible: { note }
        })
    }

    closeDialog = () => {
        this.setState({
            listItemDialogVisible: false
        });
    }

    onEditRequest = () => {
        this.closeDialog();  
        this.props.history.push({
            pathname: "/edit",
            state: { ...this.state.listItemDialogVisible }
        })             
    }

    onListItemRemove = () => {
        this.props.deleteNote(this.state.listItemDialogVisible.note, this.props.settings.calendarNotesCounter);
        this.closeDialog();              
    }

    pasteCopy = async () => {
        let note = deepCopyObject(Object.assign(this.state.copyBuffer, {
            repeatType: "no-repeat",
            added: moment(this.props.currentDate),
            forkFrom: -1,
            isShadow: false
        }))

        await this.props.addNote(note, this.props.settings.calendarNotesCounter);
        
        this.setState({
            copyBuffer: null
        });
    }

    onCopyRequest = () => {
        this.setState({
            copyBuffer: this.state.listItemDialogVisible.note, 
            listItemDialogVisible: false
        });
    }

    onImageShowRequest = (uri) => {
		this.setState({
			imageViewer: {
				uri,
				isVisible: true
			}
		})
    }

    setDate = (date) => {
        if (this.props.settings.notesShowInterval === 0) {
            let el = document.querySelectorAll(`[data-date='${date.valueOf()}']`)[1].parentElement.previousElementSibling;
            let scrollEl = document.querySelectorAll(".notes-list-item-wrapper")[1];
            scroll.top(scrollEl, el.offsetTop);
        } else {
            let cur = moment(date).startOf("day");
            let prev = moment(cur).add(-1, "day");
            let next = moment(cur).add(1, "day");

            if (this.activePageIndex === 2) {
                this.props.setDatesAndUpdateNotes([next, prev, cur], 2, this.props.settings.notesShowInterval);
            } else if (this.activePageIndex === 0) {
                this.props.setDatesAndUpdateNotes([cur, next, prev], 0, this.props.settings.notesShowInterval);
            } else {
                this.props.setDatesAndUpdateNotes([prev, cur, next], 1, this.props.settings.notesShowInterval);
            }
        }
    }

    triggerCalendar = () => {
        this.setState({calendar: !this.state.calendar})
    }

    onTodaySelect = () => {
        this.setDate(moment().startOf("day"))
    }

    onListItemMove = async () => {
        let nextDate = moment(this.props.currentDate).add(1, "day");

        await this.props.updateNoteDate({...this.state.listItemDialogVisible.note, added: nextDate}, this.props.settings.calendarNotesCounter);
        this.setState({
            listItemDialogVisible: false
        })
    }

    render() {
        let {t} = this.props;

        return (
            <div className="page-wrapper">
                <Header
                    page="notes"
                    onCalendarRequest={this.triggerCalendar}
                    onSelectToday={this.onTodaySelect}
                />
                <div className="notes-list-wrapper page-content">
                    {   
                        (!this.state.calendar && this.props.settings.showMiniCalendar) && 
                        <LightCalendar
                            calendarNotesCounter={this.props.settings.calendarNotesCounter}                            
                            currentDate={this.props.currentDate}
                            onDateSet={this.setDate}
                        />
                    }
                    {
                        (!this.state.calendar && !this.props.settings.showMiniCalendar) && 
                        <div className="current-date-shower theme-header-background">
                            {this.props.currentDate.format("dddd, D MMMM")}
                        </div>
                    }
                    {
                        this.state.calendar &&
                        <Calendar 
                            currentDate={this.props.currentDate}
                            calendarNotesCounter={this.props.settings.calendarNotesCounter}                            
                            onDateSet={this.setDate}
                            onCloseRequest={this.triggerCalendar}
                        />
                    }
                    <ReactSwipe 
                        className="notes-list-swiper" 
                        swipeOptions={{
                            continuous: true,
                            startSlide: 1,
                            callback: this.onSliderChange,
                            transitionEnd: this.onTransitionEnd 
                        }} 
                        key={this.props.notes.length}
                    >
                        {
                            this.props.notes.map((notes, i) => {
                                if (this.props.settings.notesShowInterval === 0) {
                                    return (
                                        <div 
                                            className="notes-list-item-wrapper" 
                                            key={i}
                                        >
                                            <WeekNotesList 
                                                notes={notes} 
                                                onItemDynaicFieldChange={this.props.updateNoteDynamicFields}
                                                onItemActionsWindowRequest={this.onItemActionsWindowRequest}
                                            />
                                        </div>
                                    )
                                } else {
                                    return (
                                        <div 
                                            className="notes-list-item-wrapper" 
                                            key={i}
                                        >
                                            <DayNotesList 
                                                notes={notes.items} 
                                                finSort={this.props.settings.sort.finSort}
                                                onItemDynaicFieldChange={this.props.updateNoteDynamicFields}
                                                onItemActionsWindowRequest={this.onItemActionsWindowRequest}
                                            />
                                        </div>
                                    )
                                }
                            })
                        }
                    </ReactSwipe>

                    <Modal 
                        isOpen={this.state.listItemDialogVisible ? true : false} 
                        onRequestClose={this.closeDialog}
                    >
                        {   (this.state.listItemDialogVisible && this.state.listItemDialogVisible.note.repeatType === "no-repeat") &&
                            <ButtonListItem
                                className="no-border"
                                text={t("move-tomorrow")}
                                onClick={this.onListItemMove}
                            />
                        }
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
                            text={t("to-copy")}
                            onClick={this.onCopyRequest}
                        />
                    </Modal>

                    {
                        this.state.copyBuffer && 
                        <Fab onClick={this.pasteCopy} />
                    }

                    {
                        this.props.settings.fastAdd && 
                        <FastAdd 
                            currentDate={this.props.currentDate}
                        />   
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

            let activeItemsEls = document.querySelectorAll(".note-wrapper.expanded");
            for (let i = 0; i < activeItemsEls.length; i++) {
                activeItemsEls[i].classList.remove("expanded");
            }

            this.slideChanged = false;
        }
    }

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
        settings: state.settings
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(NotesList));

function sort (data, settings) {
    let notesCompareFn = getNotesCompareFn();

    return data.map((list) => {
        list.items.sort((a, b) => {
            return notesCompareFn(a, b);
        });
        return list;
    })

    function getNotesCompareFn() {
        if (settings.sort.type === 0) {
            if (settings.sort.direction === 1) {
                return (a, b) => {
                    return a.startTimeCheckSum - b.startTimeCheckSum;
                }   
            } else {
                return (a, b) => {
                    return b.startTimeCheckSum - a.startTimeCheckSum;
                } 
            }    
        }

        if (settings.sort.type === 1) {
            if (settings.sort.direction === 1) {
                return (a, b) => a.key - b.key   
            } else {
                return (a, b) =>  b.key - a.key
            }                         
        }
    }
}