import React from 'react';

import {CalendarNotesCounterMode} from "../../../../constants";

import './CalendarDate.scss'

let CalendarDate = (props) => (
    <button
        className={`calendar-date${props.isActive ? ' active' : ''}`}
        onClick={() => props.onClick(props.date, props.isActive)}
    >
        {
            (props.notesCounterMode !== CalendarNotesCounterMode.NotShow && props.count) &&
            <span className="count">
                {
                    props.notesCounterMode === CalendarNotesCounterMode.All && props.count.finished !== 0 &&
                    <React.Fragment>
                        <span className="c-success">{props.count.finished}</span>
                        {(props.count.notFinished !== 0) && "/"}
                    </React.Fragment>
                }
                {
                    props.count.notFinished !== 0 &&
                    <span className="c-warn">{props.count.notFinished}</span>
                }
            </span>
        }
        <span className="calendar-date-value">{props.date.format('DD')}</span>
    </button>
);

let EmptyCalendarDate = () => <div className="calendar-date"></div>

export {CalendarDate, EmptyCalendarDate}