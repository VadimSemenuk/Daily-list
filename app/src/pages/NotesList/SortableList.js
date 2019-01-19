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
        this.containerEl = document.querySelectorAll(".notes-list-item-wrapper > div")[this.props.index];
        this.childrenContainerEl = document.querySelectorAll(".notes-list-item-wrapper > div > div")[this.props.index];

        this.maxScrollTop = this.childrenContainerEl.clientHeight - this.containerEl.clientHeight;
    }

    onTouchStart = (e) => {
        this.originalEl = e.target.closest(".note-draggable-wrapper");
        this.el = this.originalEl.cloneNode(true);
        this.childrenContainerEl.appendChild(this.el);
        this.originalEl.classList.add("dragging-original");

        this.lastElY = this.originalEl.offsetTop - this.containerEl.scrollTop;
        this.el.style.top = this.lastElY + "px";
        this.el.classList.add("dragging");
        this.lastY = e.nativeEvent.touches[0].clientY;

        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i] === this.el) {
                this.dragStartElIndex = i;
                this.lastElIndex = i;
                break;
            }
        }

        this.isDragging = true;

        document.addEventListener('touchmove', this.prevent, { passive: false });
    };

    onTouchEnd = (e) => {
        if (this.lastElIndex !== this.dragStartElIndex) {
            let noteSortWeight = this.props.notes[this.lastElIndex] ?
                this.props.notes[this.lastElIndex].sortWeight + 1 : this.props.notes[this.dragStartElIndex].sortWeight;
            let higherNotesSortWeight = [];
            if (this.props.notes[this.lastElIndex - 1] && (this.props.notes[this.lastElIndex - 1].sortWeight <= noteSortWeight)) {
                let diff = noteSortWeight - this.props.notes[this.lastElIndex - 1].sortWeight + 1;
                for (let i = 0; i < this.lastElIndex; i++) {
                    i !== this.dragStartElIndex && higherNotesSortWeight.push({ key: this.props.notes[i].key, weight: this.props.notes[i].sortWeight + diff });
                }
            }
        }

        this.lastElIndex = null;
        this.dragStartElIndex = null;
        this.isDragging = false;
        this.el.classList.remove("dragging");

        document.removeEventListener('touchmove', this.prevent);

        this.el.remove();
        this.originalEl.classList.remove("dragging-original");
    };

    touchMove = (e) => {
        if (!this.isDragging) {
            return;
        }

        let diff = e.nativeEvent.touches[0].clientY - this.lastY;
        this.lastY = e.nativeEvent.touches[0].clientY;
        this.lastElY = this.lastElY + diff;
        this.el.style.top = this.lastElY + "px";

        if (
            this.containerEl.scrollTop <= 0
            || Math.ceil(this.containerEl.scrollTop) >= this.maxScrollTop
            || (Math.ceil(this.lastElY + this.el.clientHeight) <= Math.ceil(this.containerEl.clientHeight) && Math.ceil(this.lastElY) >= 0)
        ) {
            this.debouncedHandleTouchMove(this.items);
        }

        if (!this.scrollHandleTimeout) {
            this.scrollHandle();
        }
    };

    scrollHandle = () => {
        if (!this.isDragging) {
            return;
        }

        let diff = null;

        if (
            Math.ceil(this.containerEl.scrollTop) < this.maxScrollTop
            && Math.ceil(this.lastElY) + this.el.clientHeight > Math.ceil(this.containerEl.clientHeight)
        ) {
            diff = -Math.abs(Math.ceil(this.lastElY + this.el.clientHeight) - Math.ceil(this.containerEl.clientHeight));
            if (diff > -3) {
                diff = -3;
            }
            if (diff < -30) {
                diff = -30;
            }
        }

        if (
            this.containerEl.scrollTop > 0
            && Math.ceil(this.lastElY) < 0
        ) {
            diff = Math.abs(Math.ceil(this.lastElY));
            if (diff < 3) {
                diff = 3;
            }
            if (diff > 30) {
                diff = 30;
            }
        }

        if (diff === null) {
            return
        }

        this.containerEl.scrollTop = Math.ceil(this.containerEl.scrollTop - diff);
        this.scrollHandleTimeout = setTimeout(() => {
            this.scrollHandleTimeout = null;
            this.scrollHandle();
        }, 20);
    };

    debouncedHandleTouchMove = throttle((items) => {
        for (let i = 0; i < items.length; i++) {
            if (this.el.isSameNode(items[i])) {
                continue;
            }

            let item = items[i];

            let targetHalfPos = this.lastElY + (this.el.clientHeight / 2) + this.containerEl.scrollTop;
            let curTop = item.offsetTop;
            let curBot = item.offsetTop + item.clientHeight;

            if (targetHalfPos >= curTop && targetHalfPos <= curBot) {
                let curHalfPos = item.offsetTop + (item.clientHeight / 2);
                if (targetHalfPos > curHalfPos) {
                    if (this.lastElIndex === i + 1) {
                        break;
                    }
                    this.lastElIndex = i + 1;
                    this.childrenContainerEl.insertBefore(this.originalEl, item.nextSibling);
                }
                if (targetHalfPos <= curHalfPos) {
                    if (this.lastElIndex === i) {
                        break;
                    }
                    this.lastElIndex = i;
                    this.childrenContainerEl.insertBefore(this.originalEl, item);
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
                this.childrenContainerEl.prepend(this.originalEl);
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
                this.childrenContainerEl.append(this.originalEl);
                break;
            }
        }
    }, 100);

    prevent = (e) => {
        e.preventDefault();
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