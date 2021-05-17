import React from 'react';
import {Link, withRouter} from 'react-router-dom';

import './Header.scss';

import LeftArrowImg from "../../assets/img/left-arrow.svg";

let Header = (props) => (
    <header className="theme-header-background">
        <div>
            {
                props.isDateViewVisible &&
                <div
                    className="current-date clickable"
                    onClick={props.onDateViewClick}
                >
                    <span className="day">{props.dateViewValue.format(props.user ? 'ddd' : 'dddd')}</span>
                    <span className="date">{props.dateViewValue.format('D MMMM')}</span>
                </div>
            }
            {
                props.title && <div className="page-title">{props.title}</div>
            }
        </div>

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
                    }
                })
            }
        </div>
    </header>
);

export default withRouter(Header);