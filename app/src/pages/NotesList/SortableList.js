import React, {PureComponent} from 'react';

import DayNotesList from './DayNotesList';

import throttle from "../../utils/throttle";

class SortableList extends PureComponent {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.items = document.querySelectorAll(".notes-list-item-wrapper > div > div")[this.props.index].children;
    }

    onTouchStart = (e) => {
        this.el = e.target.closest(".note-scrollable-wrapper");
        this.lastElY = this.el.offsetTop;
        this.el.style.top = this.lastElY + "px";
        this.el.style.position = "absolute";
        this.el.style.zIndex = "11";
        this.el.style.width = "200px";

        this.lastY = e.nativeEvent.touches[0].clientY;
    }

    onTouchEnd = (e) => {
        this.el.style.position = "static";
        this.el.style.width = "auto";
        this.el.style.top = "0";

        this.lastY = null;
        this.lastElY = 0;

        this.clearMargins(this.items);
    }

    lastY = null;
    lastElY = 0;
    touchMove = (e) => {
        let diff = e.nativeEvent.touches[0].clientY - this.lastY;
        this.lastY = e.nativeEvent.touches[0].clientY;
        this.lastElY = this.lastElY + diff;
        this.el.style.top = this.lastElY + "px";

        this.debouncedHandleTouchMove(this.items);
    }

    debouncedHandleTouchMove = throttle((items) => {
        for (var i = 0; i < items.length; i++) {
            if (this.el.isSameNode(items[i])) {
                continue;
            }

            let targetHalfPos = this.lastElY + (this.el.clientHeight / 2);
            let curTop = items[i].offsetTop;
            let curBot = items[i].offsetTop + items[i].clientHeight;

            if (targetHalfPos >= curTop && targetHalfPos <= curBot) {    
                let curHalfPos = items[i].offsetTop + (items[i].clientHeight / 2);
                if (targetHalfPos > curHalfPos) {
                    this.clearMargins(items);
                    items[i].style.marginBottom = this.el.clientHeight + "px";
                }
                if (targetHalfPos <= curHalfPos) {
                    this.clearMargins(items);
                    items[i].style.marginTop = this.el.clientHeight + "px";
                }
                break;
            }

            if (targetHalfPos < curTop && (!items[i - 1] || items[i - 1].isSameNode(this.el))) {
                this.clearMargins(items);
                items[i].style.marginTop = this.el.clientHeight + "px";
                break;
            }

            if (targetHalfPos > curBot && (!items[i + 1] || items[i + 1].isSameNode(this.el))) {
                this.clearMargins(items);
                items[i].style.marginTop = this.el.clientHeight + "px";
                break;
            }
        }
    }, 100);

    clearMargins = (items) => {
        for (var i = 0; i < items.length; i++) {
            items[i].style.marginBottom = "0px";   
            items[i].style.marginTop = "0px";                    
        }
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