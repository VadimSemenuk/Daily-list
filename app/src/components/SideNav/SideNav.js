import React, {PureComponent} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";

import {ButtonListItem} from "../ListItem/ListItem";

import * as AppActions from '../../actions';

import './SideNav.scss';

import LogoImg from "../../assets/img/logo.svg";

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

                        <div className="logo-text">v1.0.7</div>
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
                                                return (
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
        sidenav: state.sidenav
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(SideNav));