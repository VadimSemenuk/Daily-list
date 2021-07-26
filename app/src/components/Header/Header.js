import React from 'react';
import {Link, withRouter} from 'react-router-dom';

import './Header.scss';

import LeftArrowImg from "../../assets/img/left-arrow.svg";

let Header = (props) => (
    <header className={`theme-header-background${props.noBorderRadius ? ' no-border-radius' : ''}`}>
        <div className="left-wrapper">
            <div className="buttons buttons-left">
                {
                    (props.leftButtons || []).map((button, i) => {
                        return (
                            <button
                                key={i}
                                onClick={button.action}
                            >
                                <img
                                    src={button.img}
                                    alt="button"
                                />
                            </button>
                        );
                    })
                }
            </div>
            {
                props.title && <div className="page-title">{props.title}</div>
            }
        </div>

        {
            props.multiFloorTitle &&
            <div
                className="multi-floor-title clickable"
                onClick={props.onMultiFloorTitleClick}
            >
                <div className="top-section">{props.multiFloorTitle.top}</div>
                <div className="bottom-section">{props.multiFloorTitle.bottom}</div>
            </div>
        }

        <div className="right-wrapper">
            <div className="buttons">
                {
                    [
                        ...(
                            props.isBackButtonVisible !== false ?
                                [{
                                    img: LeftArrowImg,
                                    action: props.history.goBack
                                }] : []
                        ),
                        ...(props.buttons || [])
                    ].map((button, i) => {
                        if (button.action) {
                            return (
                                <button
                                    key={i}
                                    onClick={button.action}
                                >
                                    <img
                                        src={button.img}
                                        alt="button"
                                    />
                                </button>
                            );
                        } else if (button.link) {
                            return (
                                <Link
                                    key={i}
                                    className="button"
                                    to={button.link}
                                >
                                    <img
                                        src={button.img}
                                        alt="button"
                                    />
                                </Link>
                            );
                        } else {
                            return null;
                        }
                    })
                }
            </div>
        </div>
    </header>
);

export default withRouter(Header);