import React, {PureComponent} from 'react';

import Tag from "../Tag/Tag";

import './TagList.scss';

class TagList extends PureComponent {
    triggerTagActiveState = (tagId) => {
        let nextActiveTags;
        if (this.iaTagActive(tagId)) {
            nextActiveTags = this.props.activeTags.filter((_tagId) => _tagId !== tagId);
        } else {
            nextActiveTags = [...this.props.activeTags, tagId];
        }

        this.props.onActiveTagsChange(this.props.tags.filter((tag) => nextActiveTags.filter((tagId) => tag.id === tagId).length !== 0));
    }

    iaTagActive = (tagId) => {
        return Boolean(~this.props.activeTags.findIndex((_tagId) => _tagId === tagId));
    }

    render() {
        return (
            <div className="tags-list-wrapper">
                {
                    this.props.tags.map((tag, i) => {
                        let el = (
                            <div
                                key={i}
                                className="tag-wrapper"
                            >
                                <Tag
                                    name={tag.name}
                                    isActive={this.iaTagActive(tag.id)}
                                    onClick={() => this.triggerTagActiveState(tag.id)}
                                />
                            </div>
                        );

                        if (this.props.onItemRender) {
                            return this.props.onItemRender(el, i);
                        } else {
                            return el;
                        }
                    })
                }
            </div>
        )
    }
}

export default TagList;