import React, {PureComponent} from 'react';

import DayNotesList from './DayNotesList';

import throttle from "../../utils/throttle";

class SortableList extends PureComponent {
    constructor(props) {
        super(props);
    }

    onTouchStart = (e) => {
        this.el = e.target.closest(".note-scrollable-wrapper");
        this.lastElY = this.el.offsetTop;
        this.el.style.top = this.lastElY + "px";
        this.el.style.position = "absolute";
        this.el.style.zIndex = "11";
        this.el.style.width = "200px";
    }

    onTouchEnd = (e) => {
        this.el.style.position = "static";
        this.el.style.width = "auto";
        this.el.style.top = "0";

        this.lastY = null;
        this.lastElY = 0;
    }

    lastY = null;
    lastElY = 0;
    touchMove = (e) => {
        if (this.lastY === null) {
            this.lastY = e.nativeEvent.touches[0].clientY;
        }
        let diff = e.nativeEvent.touches[0].clientY - this.lastY;
        this.lastElY = this.lastElY + diff;
        this.lastY = e.nativeEvent.touches[0].clientY;
        this.el.style.top = this.lastElY + "px";

        this.debouncedHandleTouchMove();
    }

    debouncedHandleTouchMove = throttle(() => {
        let container = document.querySelectorAll(".notes-list-item-wrapper > div > div")[1];
        for (var i = 0; i < container.children.length; i++) {
            if (this.el.isSameNode(container.children[i])) {
                continue;
            }

            let targetHalfPos = this.lastElY + (this.el.clientHeight / 2);
            let curTop = container.children[i].offsetTop;
            let curBot = container.children[i].offsetTop + container.children[i].clientHeight;
            if (targetHalfPos >= curTop && targetHalfPos <= curBot) {                
                let curHalfPos = container.children[i].offsetTop + (container.children[i].clientHeight / 2);
                if (targetHalfPos > curHalfPos) {
                    for (var ii = 0; ii < container.children.length; ii++) {
                        container.children[ii].style.marginBottom = "0px";   
                        container.children[ii].style.marginTop = "0px";                    
                    }
                    container.children[i].style.marginBottom = this.el.clientHeight + "px";
                }
                if (targetHalfPos <= curHalfPos) {
                    for (var ii = 0; ii < container.children.length; ii++) {
                        container.children[ii].style.marginBottom = "0px";   
                        container.children[ii].style.marginTop = "0px";                    
                    }
                    container.children[i].style.marginTop = this.el.clientHeight + "px";
                }
                break;
            }
        }
    }, 200);

    render() {
        return (
            <div
                onTouchMove={this.touchMove}
            >
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