import React, {PureComponent} from 'react';

import TextCheckBox from '../../../components/TextCheckBox/TextCheckBox';
import CustomCheckBox from '../../../components/CustomCheckBox/CustomCheckBox';
import Tag from "../../../components/Tag/Tag";

import AlarmImg from '../../../assets/img/alarm.svg';
import MoreImg from "../../../assets/img/more.svg";
import RepeatImg from "../../../assets/img/repeat.svg";
import ImageImg from "../../../assets/img/image.svg";

import {NoteContentItemType, NoteRepeatType} from "../../../constants";

import './Note.scss';

class Note extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            expanded: false,
        };
    }

    onListItemTrigger = (listItemIndex, nextValue) => {
        let nextContentItems = [
            ...this.props.data.contentItems.slice(0, listItemIndex),
            {
                ...this.props.data.contentItems[listItemIndex],
                checked: nextValue
            },
            ...this.props.data.contentItems.slice(listItemIndex + 1)
        ];

        this.props.onNoteChange(this.props.data, {contentItems: nextContentItems});
    };

    onFinishTrigger = (v) => {
        this.props.onNoteChange(this.props.data, {isFinished: v});
    };

    onDialogRequest = (e) => {
        e.stopPropagation();

        this.props.onDialogRequest(this.props.data);
    }

    triggerExpanded = () => {
        this.setState({expanded: !this.state.expanded});
    };

    showImage = (e) => {
        e.stopPropagation();
        
        window.PhotoViewer.show(e.target.src, this.props.data.title, {share: false});         
    };

    render () {
        return (
            <div
                className={
                    "note"
                    + ((this.state.expanded || !this.props.minimize) ? ' expanded' : '')
                    + (this.props.minimize ? '' : ' force-expanded')
                }
                onClick={this.triggerExpanded}
            >
                <div
                    style={{backgroundColor: this.props.data.tag}}
                    className="color-tag"
                ></div>
                <div className="note-content">
                    <div className="note-header">
                        {
                            this.props.data.tags.length !== 0 &&
                            <div className="tags-wrapper">
                                {
                                    this.props.data.tags.map((tag, i) => (
                                        <Tag
                                            key={i}
                                            name={tag.name}
                                        />
                                    ))
                                }
                            </div>
                        }
                        {this.props.data.startTime && <span className="note-header-time">{this.props.data.startTime.format('HH:mm')}</span>}
                        {this.props.data.endTime && <span className="note-header-time-divider">-</span>}
                        {this.props.data.endTime && <span className="note-header-time">{this.props.data.endTime.format('HH:mm')}</span>}
                        {
                            this.props.data.isNotificationEnabled &&
                            <div className="notification-identifier-wrapper">
                                <img
                                    className="notification-identifier"
                                    src={AlarmImg}
                                    alt="notify"
                                />
                            </div>
                        }
                        {
                            this.props.data.repeatType !== NoteRepeatType.NoRepeat &&
                            <div className="repeat-identifier-wrapper">
                                <img
                                    className="repeat-identifier"
                                    src={RepeatImg}
                                    alt="repeat"
                                />
                            </div>
                        }
                    </div>
                    <div className="title-wrapper">
                        {!!this.props.data.title && <div className="note-title">{this.props.data.title}</div>}
                    </div>
                    {
                        this.props.data.contentItems.map((a, i) => {
                            if (!a) {

                            } else if (a.type === NoteContentItemType.Text) {
                                return (
                                    <div
                                        className="item-data-text"
                                        key={i}
                                    >{a.value}</div>
                                )
                            } else if (a.type === NoteContentItemType.ListItem) {
                                return (
                                    <TextCheckBox
                                        key={i}
                                        id={i}
                                        textValue={a.value}
                                        checkBoxValue={a.checked}
                                        onValueChange={this.onListItemTrigger}
                                    />
                                )
                            } else if (a.type === NoteContentItemType.Image) {
                                if (this.state.expanded || !this.props.minimize) {
                                    return (
                                        <div
                                            key={i}
                                            className="attached-image-wrapper">
                                            <img
                                                onClick={this.showImage}
                                                className="attached-image"
                                                src={a.value}
                                                alt="attachment"
                                            />
                                        </div>
                                    )
                                } else {
                                    return (
                                        <img
                                            key={i}
                                            className="attached-image-label"
                                            src={ImageImg}
                                            alt="attached"
                                        />
                                    )
                                }
                            }
                            return null;
                        })
                    }

                    {
                        this.props.isActionsViewVisible !== false &&
                        <React.Fragment>
                            <div className="more-button">
                                <button onClick={this.onDialogRequest}>
                                    <img
                                        src={MoreImg}
                                        alt="more"
                                    />
                                </button>
                            </div>
                            <div className="note-finish-checkbox">
                                <CustomCheckBox
                                    checked={this.props.data.isFinished}
                                    onChange={this.onFinishTrigger}
                                />
                            </div>
                        </React.Fragment>
                    }
                </div>
            </div>
        )
    }
}

export default Note;