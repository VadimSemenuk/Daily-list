import React, {PureComponent} from 'react';

import DayNotesList from './DayNotesList';

import throttle from "../../utils/throttle";

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

        window.perf = [];
    }

    componentDidMount() {
        this.items = document.querySelectorAll(".notes-list-item-wrapper > div > div")[this.props.index].children;
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
    }

    onTouchEnd = () => {
        this.el.classList.remove("dragging");
        this.hadlePrevCheckedEl();

        setTimeout(() => {
            this.hadlePrevCheckedEl();
        }, 100);
    }

    touchMove = (e) => {
        let diff = e.nativeEvent.touches[0].clientY - this.lastY;
        this.lastY = e.nativeEvent.touches[0].clientY;
        this.lastElY = this.lastElY + diff;
        this.el.style.top = this.lastElY + "px";

        this.debouncedHandleTouchMove(this.items);
    }

    debouncedHandleTouchMove = throttle((items) => {
        // if touchend remove margins

        for (var i = 0; i < items.length; i++) {
            if (this.el.isSameNode(items[i])) {
                continue;
            }

            let item = items[i];

            let targetHalfPos = this.lastElY + (this.el.clientHeight / 2);
            let curTop = item.offsetTop;
            let curBot = item.offsetTop + item.clientHeight;

            if (targetHalfPos >= curTop && targetHalfPos <= curBot) {   
                let curHalfPos = item.offsetTop + (item.clientHeight / 2);
                this.hadlePrevCheckedEl(item);
                if (targetHalfPos > curHalfPos) {
                    item.style.marginBottom = this.el.clientHeight + "px";
                }
                if (targetHalfPos <= curHalfPos) {
                    item.style.marginTop = this.el.clientHeight + "px";
                }
                break;
            }

            if (targetHalfPos < curTop && (!items[i - 1] || items[i - 1].isSameNode(this.el))) {
                this.hadlePrevCheckedEl(item);
                item.style.marginTop = this.el.clientHeight + "px";
                break;
            }

            if (targetHalfPos > curBot && (!items[i + 1] || items[i + 1].isSameNode(this.el))) {
                this.hadlePrevCheckedEl(item);
                item.style.marginBottom = this.el.clientHeight + "px";
                break;
            }
        }
    }, 100);

    hadlePrevCheckedEl = (item) => {
        if (this.prevCheckedEl) {
            this.prevCheckedEl.style.marginBottom = "0px";   
            this.prevCheckedEl.style.marginTop = "0px"; 
        }
        this.prevCheckedEl = item;
    }

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

export default SortableList;