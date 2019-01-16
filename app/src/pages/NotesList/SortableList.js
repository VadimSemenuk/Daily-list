import React, {PureComponent} from 'react';
import {connect} from "react-redux";

import * as AppActions from '../../actions';

import DayNotesList from './DayNotesList';

import throttle from "../../utils/throttle";
import {bindActionCreators} from "redux";

function avg(arr) {
    let sum = arr.reduce(function(a, b) { return a + b; });
    let avg = sum / arr.length;
	return avg;
}
window.avg = avg;

class SortableList extends PureComponent {
    constructor(props) {
        super(props);

        this.items = null;

        this.lastY = 0;
        this.lastElY = 0;
        this.el = null;
        this.prevCheckedEl = null;
        this.isDragging = false;

        this.dragStartElIndex = null;
        this.lastElIndex = null;
    }

    componentDidMount() {
        this.items = document.querySelectorAll(".notes-list-item-wrapper > div > div")[this.props.index].children;
        this.containerEl = document.querySelectorAll(".notes-list-item-wrapper")[this.props.index];
        // document.addEventListener('touchmove', this.prevent, { passive: false });
    }

    onTouchStart = (e) => {
        this.el = e.target.closest(".note-draggable-wrapper");
        this.lastElY = this.el.offsetTop;
        this.el.style.top = this.lastElY + "px";
        this.el.classList.add("dragging");

        this.lastY = e.nativeEvent.touches[0].clientY;

        if (this.el.nextSibling) {
            this.el.nextSibling.style.marginTop = this.el.clientHeight + "px";
            this.prevCheckedEl = this.el.nextSibling;
        } else if (this.el.prevSibling) {
            this.el.prevSibling.style.marginBottom = this.el.clientHeight + "px";
            this.prevCheckedEl = this.el.prevSibling;
        }

        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i] === this.el) {
                this.dragStartElIndex = i;
                this.lastElIndex = i;
                break;
            }
        }

        this.isDragging = true;
    };

    onTouchEnd = (e) => {
        if (this.lastElIndex !== this.dragStartElIndex) {
            console.log("lastElIndex", this.lastElIndex);
            console.log("dragStartElIndex", this.dragStartElIndex);

            let noteSortWeight = this.props.notes[this.lastElIndex] ?
                this.props.notes[this.lastElIndex].sortWeight + 1 : this.props.notes[this.dragStartElIndex].sortWeight;
            let higherNotesSortWeight = [];
            if (this.props.notes[this.lastElIndex - 1] && (this.props.notes[this.lastElIndex - 1].sortWeight <= noteSortWeight)) {
                let diff = noteSortWeight - this.props.notes[this.lastElIndex - 1].sortWeight + 1;
                for (let i = 0; i < this.lastElIndex; i++) {
                    i !== this.dragStartElIndex && higherNotesSortWeight.push({ key: this.props.notes[i].key, weight: this.props.notes[i].sortWeight + diff });
                }
            }

            console.log("higherNotesSortWeight", higherNotesSortWeight);
            console.log("noteSortWeight", noteSortWeight);
            console.log("prevNoteSortWeight", this.props.notes[this.lastElIndex]);
            this.props.onDragSort({ key: this.props.notes[this.dragStartElIndex].key, weight: noteSortWeight }, higherNotesSortWeight);
        }

        this.lastElIndex = null;
        this.dragStartElIndex = null;
        this.isDragging = false;
        this.el.classList.remove("dragging");
        this.hadlePrevCheckedEl();
    };

    touchMove = (e) => {
        if (!this.isDragging) {
            return;
        }

        let diff = e.nativeEvent.touches[0].clientY - this.lastY;
        this.lastY = e.nativeEvent.touches[0].clientY;
        this.lastElY = this.lastElY + diff;
        this.el.style.top = this.lastElY + "px";

        this.debouncedHandleTouchMove(this.items);
    };

    debouncedHandleTouchMove = throttle((items) => {
        for (let i = 0; i < items.length; i++) {
            if (this.el.isSameNode(items[i])) {
                continue;
            }

            let item = items[i];

            let targetHalfPos = this.lastElY + (this.el.clientHeight / 2);
            let curTop = item.offsetTop;
            let curBot = item.offsetTop + item.clientHeight;

            if (targetHalfPos >= curTop && targetHalfPos <= curBot) {  
                let curHalfPos = item.offsetTop + (item.clientHeight / 2);
                if (targetHalfPos > curHalfPos) {
                    if (this.lastElIndex === i + 1) {
                        break;
                    }
                    this.lastElIndex = i + 1;
                    this.hadlePrevCheckedEl(item);
                    item.style.marginBottom = this.el.clientHeight + "px";
                }
                if (targetHalfPos <= curHalfPos) {
                    if (this.lastElIndex === i) {
                        break;
                    }
                    this.lastElIndex = i;
                    this.hadlePrevCheckedEl(item);
                    item.style.marginTop = this.el.clientHeight + "px";
                }
                break;
            }

            if (
                targetHalfPos < curTop && 
                (
                    !items[i - 1] || 
                    (items[i - 1].isSameNode(this.el) && (i - 1) === 0)
                )
            ) {
                if (this.lastElIndex === 0) {
                    break;
                }
                this.lastElIndex = 0;
                this.hadlePrevCheckedEl(item);
                item.style.marginTop = this.el.clientHeight + "px";
                break;
            }

            if (
                targetHalfPos > curBot && 
                (
                    !items[i + 1] || 
                    (items[i + 1].isSameNode(this.el) && (i + 1) === (items.length - 1))
                )
            ) {
                if (this.lastElIndex === i + 1) {
                    break;
                }
                this.lastElIndex = i + 1;
                this.hadlePrevCheckedEl(item);
                item.style.marginBottom = this.el.clientHeight + "px";
                break;
            }
        }

        if (this.lastElY <= 10) {
            console.log(this.containerEl.scrollTop);
        }

        if (!this.isDragging) {
            this.hadlePrevCheckedEl();
        }
    }, 100);

    hadlePrevCheckedEl = (item) => {
        if (this.prevCheckedEl) {
            this.prevCheckedEl.style.marginBottom = "0px";   
            this.prevCheckedEl.style.marginTop = "0px"; 
        }
        this.prevCheckedEl = item;
    };

    render() {
        return (
            <div onTouchMove={this.touchMove}>
                <DayNotesList
                    {...this.props}
                    onTouchStart={this.onTouchStart}
                    onTouchEnd={this.onTouchEnd}
                />
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        currentDate: state.date,
        settings: state.settings
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SortableList);