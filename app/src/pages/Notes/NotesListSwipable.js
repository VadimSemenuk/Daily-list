import React, {PureComponent} from 'react';
import ReactSwipe from 'react-swipe';

import NotesList from "./NotesList";

import getSliderChangeSide from "../../utils/sliderChangeSide";

class NotesListSwipable extends PureComponent {
    constructor(props) {
        super(props);

        this.activePageIndex = 1;
        this.prevPageIndex = 1;
        this.hasUnprocessedSlideChange = true;
    }

    onTransitionEnd = () => {
        if (this.hasUnprocessedSlideChange) {
            let listEls = document.querySelectorAll(".notes-list-item-wrapper");
            for (let i = 0; i < listEls.length; i++) {
                listEls[i].scrollTop = 0
            }

            let activeItemsEls = document.querySelectorAll(".note-wrapper.expanded:not(.force-expanded)");
            for (let i = 0; i < activeItemsEls.length; i++) {
                activeItemsEls[i].classList.remove("expanded");
            }

            this.hasUnprocessedSlideChange = false;
        }
    }

    onSlideChange = (e) => {
        this.hasUnprocessedSlideChange = true;

        let action = getSliderChangeSide(e, this.activePageIndex, this.prevPageIndex);
        this.prevPageIndex = action.prevPageIndex;
        this.activePageIndex = action.activePageIndex;

        this.props.onSlideChange(action.side, action.nextIndex);
    }

    onDragSortModeTrigger = (value) => {
        this.swipe.disableScrolling(value);
    }

    render() {
        return (
            <ReactSwipe
                ref={(node) => {
                    if (node) {
                        this.swipe = node.swipe;
                    }
                }}
                className="notes-list-swiper"
                swipeOptions={{
                    continuous: true,
                    startSlide: 1,
                    callback: this.onSlideChange,
                    transitionEnd: this.onTransitionEnd,
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
                                onOrderChange={this.props.onOrderChange}
                                onNoteChange={this.props.onNoteChange}
                                onDialogRequest={this.props.onDialogRequest}
                            />
                        </div>
                    ))
                }
            </ReactSwipe>
        )
    }
}

export default NotesListSwipable;