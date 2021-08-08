import React, {PureComponent} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";
import {throttle} from "../../utils/throttle";

import Header from '../../components/Header/Header';

import * as AppActions from '../../actions';

import './Tags.scss';
import RemoveImg from "../../assets/img/remove.png";
import AddImg from "../../assets/img/add-gray.svg";

class Tags extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            tags: this.props.tags.slice(),
            newTag: this.getEmptyTag()
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.tags !== this.props.tags) {
            this.setState({
                tags: this.props.tags.slice()
            });
        }
    }

    getEmptyTag = () => {
        return {
            name: ""
        }
    }

    onTagAdd = () => {
        this.props.addTag(this.state.newTag);

        this.setState({
            newTag: this.getEmptyTag()
        });
    }

    onTagChange = (tag, nextName) => {
        let tagIndex = this.state.tags.findIndex((_tag) => _tag.id === tag.id)
        let nextTag = {...this.state.tags[tagIndex], name: nextName}
        this.setState({
            tags: [...this.state.tags.slice(0, tagIndex), nextTag, ...this.state.tags.slice(tagIndex + 1)]
        });

        this.throttledUpdateTag(nextTag);
    }
    throttledUpdateTag = throttle(this.props.updateTag, 1000)

    onTagDelete = (id) => {
        this.props.deleteTag(id);
    }

    onKeyPress = (e) => {
        if (e.key === "Enter") {
            this.onTagAdd();
        }
    }

    onNewTagChange = (nextName) => {
        this.setState({
            newTag: {
                ...this.state.newTag,
                name: nextName
            }
        });
    }

    render() {
        let {t} = this.props;

        return (
            <div className="page-wrapper">
                <Header title={t("tags")}/>
                <div className="tags-wrapper scroll page-content padding">
                    {
                        this.state.tags.map((tag, i) => (
                            <div
                                key={i}
                                className="tag-edit-wrapper"
                            >
                                <input
                                    type="text"
                                    className="content-input"
                                    value={tag.name}
                                    onChange={(e) => this.onTagChange(tag, e.target.value)}
                                />

                                <button
                                    className='remove-button'
                                    onClick={() => this.onTagDelete(tag.id)}
                                >
                                    <img
                                        src={RemoveImg}
                                        alt="rm"
                                    />
                                </button>
                            </div>
                        ))
                    }

                    <div className="tag-add-wrapper">
                        <input
                            type="text"
                            className="content-input"
                            placeholder={t("add-tag-placeholder")}
                            value={this.state.newTag.name}
                            onChange={(e) => this.onNewTagChange(e.target.value)}
                            onKeyPress={this.onKeyPress}
                        />

                        <button
                            className='add-button'
                            disabled={this.state.newTag.name.length === 0}
                            onClick={this.onTagAdd}
                        >
                            <img
                                src={AddImg}
                                alt="add"
                            />
                        </button>
                    </div>
                </div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        tags: state.tags.map((tag) => ({...tag}))
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(Tags));