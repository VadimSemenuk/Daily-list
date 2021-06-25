import React, {PureComponent} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";

import {ButtonListItem} from "../ListItem/ListItem";
import TagList from "../TagList/TagList";

import LogoImg from "../../assets/img/logo.svg";
import TagImg from "../../assets/img/tag.svg";

import * as AppActions from '../../actions';

import './SideNav.scss';

class SideNav extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            hidden: false
        };
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.sidenav.isOpen && this.props.sidenav.isOpen) {
            this.setBackButtonEventHandler();
        }
        if (prevProps.sidenav.isOpen && !this.props.sidenav.isOpen) {
            this.removeBackButtonEventHandler();
        }
    }

    componentWillUnmount() {
        this.removeBackButtonEventHandler();
    }

    setBackButtonEventHandler = () => {
        document.addEventListener("backbutton", this.onBackButtonClick, false);
    };

    removeBackButtonEventHandler = () => {
        document.removeEventListener("backbutton", this.onBackButtonClick, false);
    };

    onBackButtonClick = () => {
        this.props.triggerSidenav();
    }

    hideSidebarWhileCloseAnimation() {
        this.triggerHiddenState();
        setTimeout(this.triggerHiddenState, 100);
    }

    triggerHiddenState = () => {
        this.setState({
            hidden: !this.state.hidden
        });
    }

    render() {
        let {t} = this.props;

        return (
            <div className={`sidenav-wrapper${this.props.sidenav.isOpen ? " transition visible" : ""}${this.state.hidden ? " hidden" : ""}`}>
                <div className="sidenav">
                    <div className="logo-wrapper theme-header-background">
                        <img
                            src={LogoImg}
                            alt="button"
                        />

                        <div className="logo-text">{t("app-name")} <br/>v1.0.7</div>
                    </div>
                    <div className="items">
                        {
                            this.props.sidenav.items.map((contentItems, contentItemsIndex) => {
                                return (
                                    <div
                                        key={contentItemsIndex}
                                        className="items-block"
                                    >
                                        {
                                            contentItems.map((contentItem, contentItemIndex) => {
                                                let listEl = (
                                                    <ButtonListItem
                                                        key={contentItemIndex}
                                                        className={`content-item no-border${contentItem.isActive ? " active" : ""}`}
                                                        text={t(contentItem.textId)}
                                                        leftImg={contentItem.img}
                                                        onClick={() => {
                                                            this.hideSidebarWhileCloseAnimation();
                                                            this.props.triggerSidenav();
                                                            contentItem.action();
                                                        }}
                                                    />
                                                );

                                                if (contentItem.showTags) {
                                                    return (
                                                        <div key={contentItemIndex}>
                                                            <TagList
                                                                tags={this.props.tags}
                                                                activeTags={this.props.settings.noteFilters.tags}
                                                                onActiveTagsChange={(value) => {
                                                                    this.props.setSetting("noteFilters", {...this.props.settings.noteFilters, tags: value.map((tag) => tag.id)})
                                                                }}
                                                                onItemRender={(itemEl, key) => (
                                                                    <div
                                                                        key={key}
                                                                        className="sidenav-tag-wrapper"
                                                                    >
                                                                        <img
                                                                            src={TagImg}
                                                                            alt="tag"
                                                                        />
                                                                        {itemEl}
                                                                    </div>
                                                                )}
                                                            />
                                                        </div>
                                                    )
                                                } else {
                                                    return listEl;
                                                }
                                            })
                                        }
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
                <div
                    className="fill"
                    onClick={this.props.triggerSidenav}
                ></div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        sidenav: state.sidenav,
        settings: state.settings,
        tags: state.tags
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(SideNav));