import React, {PureComponent} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import moment from "moment";
import ReactSwipe from 'react-swipe';
import Modal from 'react-responsive-modal';

import synchronizationService from '../../services/synchronization.service';
import appService from "../../services/app.service";
import authService from "../../services/auth.service";

import FastAdd from '../Add/FastAdd/FastAdd';
import DayNotesList from './DayNotesList/DayNotesList';
import LightCalendar from '../../components/Calendar/LightCalendar/LightCalendar';
import Calendar from '../../components/Calendar/Calendar/Calendar';
import Header from '../../components/Header/Header';

import * as AppActions from '../../actions'; 

import './NotesList.scss';
import pasteImg from "../../media/img/insert.svg"

let modalClass = {
    modal: "note-actions-modal modal",
    overlay: "modal-overlay"
}

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
        // this.props.triggerSynchronizationLoader(true);
        let deviceIMEI = await appService.getDeviceIMEI();
        let userId = authService.getUserId();

        let newNotes = await synchronizationService.getNewNotes(deviceIMEI, userId);
        if (newNotes && newNotes.length) {
            await synchronizationService.setNewNotes(newNotes, deviceIMEI);
        }

        let notSynkedLocalNotes = await synchronizationService.getNotSyncedLocalNotesFull(userId);
        if (notSynkedLocalNotes && notSynkedLocalNotes.length) {
            await synchronizationService.sendNewLocalNotes(notSynkedLocalNotes, deviceIMEI, userId);
        }
        // this.props.triggerSynchronizationLoader(false);        
    }

    onSlideChange = async ({index, nextIndex, side}) => {
        if (side === "left") {    
            let nextDate = moment(this.props.currentDate).add(-1, "day");
            this.props.setListDate(
                nextDate,
                moment(nextDate).add(-1, "day"),
                nextIndex,
                this.props.settings
            )
        } else {   
            let nextDate = moment(this.props.currentDate).add(1, "day");
            this.props.setListDate(
                nextDate,
                moment(nextDate).add(1, "day"),
                nextIndex,
                this.props.settings                
            )     
        }
    }

    onItemActionsWindowRequest = (dateIndex, noteIndex) => {
        this.setState({
            listItemDialogVisible: {
                dateIndex, 
                noteIndex,
                note: this.props.notes[dateIndex][noteIndex]
            }
        })
    }

    closeDialog = () => {
        this.setState({listItemDialogVisible: false});
    }

    onEditRequest = () => {
        this.closeDialog();  
        this.props.history.push({
            pathname: "/edit",
            state: { ...this.state.listItemDialogVisible }            
        })             
    }

    onListItemRemove = () => {
        this.props.deleteNote(
            this.state.listItemDialogVisible.dateIndex, 
            this.state.listItemDialogVisible.noteIndex, 
            this.state.listItemDialogVisible.note        
        );
        this.closeDialog();              
    }

    pasteCopy = async () => {
        await this.props.addNote(JSON.parse(JSON.stringify(
            {
                ...this.state.copyBuffer, 
                finished: false, 
                added: moment(this.props.currentDate).valueOf()
            }
        )), this.activePageIndex);
        
        this.setState({
            copyBuffer: null
        });
    }

    onCopyRequest = () => {
        let note = this.props.notes[this.state.listItemDialogVisible.dateIndex][this.state.listItemDialogVisible.noteIndex]
        this.setState({copyBuffer: note, listItemDialogVisible: false});
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
        if (this.activePageIndex === 2) {
            this.props.setDate([
                moment(date).add(1, "day"),
                moment(date).add(-1, "day"),
                moment(date).startOf("day"),
            ], 2, this.props.settings);
        } else if (this.activePageIndex === 0) {
            this.props.setDate([
                moment(date).startOf("day"),
                moment(date).add(1, "day"),
                moment(date).add(-1, "day"),
            ], 0, this.props.settings);
        } else {
            this.props.setDate([
                moment(date).add(-1, "day"),
                moment(date).startOf("day"),
                moment(date).add(1, "day"),
            ], 1, this.props.settings);
        }
    }

    setSliderRef = (a) => {
        this.sliderRef = a;
    }

    onFastAdd = (note) => {
        this.props.addNote(note, this.activePageIndex);
    }

    onDateSelect = (e) => {
        this.setDate(e);
    }

    triggerCalendar = () => {
        this.setState({calendar: !this.state.calendar})
    }

    onAddPageRequest = () => {
        this.props.history.push({
            pathname: `/add`,
            state: { dateIndex: this.activePageIndex }
        })
    }

    onTodaySelect = () => {
        this.setDate(moment().startOf("day"))
    }

    render() {
        return (
            <div className="page-wrapper">
                <Header
                    page="notes"
                    showCurrentDate={true}
                    onAddPageRequest={this.onAddPageRequest}
                    onCalendarRequest={this.triggerCalendar}
                    onSelectToday={this.onTodaySelect}
                />
                <div className="notes-list-wrapper page-content">
                    {   
                        !this.state.calendar && 
                        <LightCalendar 
                            settings={this.props.settings}
                            onDateSet={this.setDate}
                            currentDate={this.props.currentDate}
                        />
                    }
                    {
                        this.state.calendar &&
                        <Calendar 
                            currentDate={this.props.currentDate}
                            settings={this.props.settings}
                            onDateSet={this.setDate}
                        />
                    }
                    <ReactSwipe 
                        ref={this.setSliderRef}
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
                            [null, null, null].map((a, i) => (
                                <div className="notes-list-item-wrapper" key={i}>
                                    <DayNotesList 
                                        notes={this.props.notes[i]} 
                                        index={i}
                                        onItemDynaicFieldChange={this.props.updateNoteDynamicFields}
                                        onItemFinishChange={this.props.setNoteCheckedState}
                                        onItemActionsWindowRequest={this.onItemActionsWindowRequest}
                                    />
                                </div>
                            ))
                        }
                    </ReactSwipe>

                    <Modal 
                        open={this.state.listItemDialogVisible ? true : false} 
                        onClose={this.closeDialog}
                        center
                        showCloseIcon={false}
                        classNames={modalClass}
                        animationDuration={0}
                    >
                        <div className="modal-inner note-actions-modal-inner actions-modal-inner">
                            <button onClick={this.onEditRequest}>Редактировать</button>
                            <button onClick={this.onListItemRemove}>Удалить</button>
                            <button onClick={this.onCopyRequest}>Копировать</button>                        
                        </div>
                    </Modal>

                    {
                        this.state.copyBuffer && 
                        <button 
                            className="fab"
                            onClick={this.pasteCopy}
                        >
                            <img 
                                src={pasteImg}
                                alt="insert"
                            />
                        </button>
                    }

                    {
                        !!this.props.settings.fastAdd && 
                        <FastAdd 
                            currentDate={this.props.currentDate}
                            onSubmit={this.onFastAdd}
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

    onSliderChange = (a) => {     
        this.slideChanged = true;    
        let action = this.getSlideAction(a);                
        if (this.onSlideChange) {
            this.onSlideChange(action);
        }
    }

    getSlideAction = (index) => {
        if (index === 0 && this.activePageIndex === 2) {
            return this.onSliderRigth(index);
        } else if (index === 2 && this.activePageIndex === 0) {
            return this.onSliderLeft(index);
        } else if (this.activePageIndex < index) {
            return this.onSliderRigth(index);                
        } else if (this.activePageIndex > index) {
            return this.onSliderLeft(index);                
        } else if (this.prevPageIndex > index) {          
            return this.onSliderRigth(index);   
        } else if (this.prevPageIndex < index) {                      
            return this.onSliderLeft(index);            
        }
    }

    onSliderRigth = (index) => {                                                                                             
        let nextIndex = index + 1;
        if (nextIndex > 2) {
            nextIndex = 0;
        };
        this.prevPageIndex = this.activePageIndex;
        this.activePageIndex = index; 
        return {
            index, nextIndex, 
            side: 'right'
        }
    }

    onSliderLeft = (index) => {                                                                    
        let nextIndex = index - 1;
        if (nextIndex < 0) {
            nextIndex = 2;
        };
        this.prevPageIndex = this.activePageIndex;        
        this.activePageIndex = index; 
        return {
            index, nextIndex, 
            side: 'left'
        }
    }
}

function mapStateToProps(state, props) {
    sort(state.notes, state.settings);

    return {
        notes: state.notes,
        currentDate: state.date,
        settings: state.settings
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(NotesList);

function sort (data, settings) {
    let notesCompareFn = getNotesCompareFn();

    return data.map((list) => {
        if (settings.finishedSort === 2) {
            list.sort((a, b) => {
                if (a.finished === b.finished) {
                    return notesCompareFn(a, b)
                } else {
                    return a.finished - b.finished
                }
            })
        } else {
            list.sort((a, b) => {
                return notesCompareFn(a, b)
            })
        }
        return list
    })

    function getNotesCompareFn() {
        if (settings.sort === 1) {
            return (a, b) => {
                let aVal = 0, bVal = 0;
                if (a.startTime) {
                    aVal = a.startTime.valueOf();
                }
                if (b.startTime) {
                    bVal = b.startTime.valueOf();
                }               
                return aVal - bVal; 
            }          
        }
        if (settings.sort === 2) {
            return (a, b) => {
                let aVal = 0, bVal = 0;
                if (a.startTime) {
                    aVal = a.startTime.valueOf();
                }
                if (b.startTime) {
                    bVal = b.startTime.valueOf();
                }
                return bVal - aVal; 
            }            
        }
        if (settings.sort === 3) {           
            return (a, b) => a.key - b.key            
        }
        if (settings.sort === 4) {
            return (a, b) =>  b.key - a.key       
        }
    }
}