import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";

import * as AppActions from '../../actions';

import Logo from '../../assets/img/logo.png';

import Header from '../../components/Header/Header';
import {InsetListItem, TriggerListItem} from "../../components/ListItem/ListItem";

import './About.scss';

class About extends Component {
    constructor(props) {
        super(props);

        this.state = {
            bazinga: false,
            logoClicksCounter: 0,
            lang: "en"
        }
    }

    componentDidMount() {
        if (this.props.settings.lang === "ru") {
            this.setState({
                lang: "ru"
            })
        }
    }

    launthMarket = () => {
        if (navigator.connection.type === window.Connection.NONE) {
            window.plugins.toast.showLongBottom(this.props.t("internet-required"));       
            return 
        }

        window.LaunchReview.launch();
    }

    openSettings() {
        window.cordova.plugins.settings.open(["application_details", true])
    }

    onLogoClick = () => {
        let nextClickCount = this.state.logoClicksCounter + 1;
        let bazinga = nextClickCount === 5;

        this.setState({
            logoClicksCounter: nextClickCount,
            bazinga
        })
    }

    render () {
        let {t} = this.props;

        return (
            <div className="page-wrapper page-about">
                <Header title={t("about")}/>
                <div className="scroll page-content padding">
                    {   this.state.bazinga &&
                        <img 
                            className="bazinga app-logo"
                            src={require("../../assets/img/bazinga.jpg")}
                            alt="bazinga"
                        />
                    }
                    {
                        !this.state.bazinga &&
                        <img 
                            className="app-logo"
                            src={Logo}
                            alt="app-logo"
                            onClick={this.onLogoClick}
                        />
                    }
                    <div className="text-center">
                        <strong>{t("app-name")}</strong>
                        <p>&#9400; 2017 Mamindeveloper</p>
                        <p>mamindeveloper@gmail.com</p>
                    </div> 
                    <InsetListItem 
                        text={t("star-app")}
                        onClick={this.launthMarket}  
                    />
                    <TriggerListItem text={t("resources")}>
                        <div>
                            <strong>{t("graphics")}</strong>
                            <div>Icons made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0">CC 3.0 BY</a></div>           
                            <div>Icons made by <a href="http://www.flaticon.com/authors/madebyoliver" title="Madebyoliver">Madebyoliver</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" >CC 3.0 BY</a></div>
                            <div>Icons made by <a href="http://www.flaticon.com/authors/chris-veigt" title="Chris Veigt">Chris Veigt</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" >CC 3.0 BY</a></div>
                            <div>Icons made by <a href="https://www.flaticon.com/authors/lucy-g" title="Lucy G">Lucy G</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" >CC 3.0 BY</a></div>
                            <div>Icons made by <a href="https://www.flaticon.com/authors/smashicons" title="Smashicons">Smashicons</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" >CC 3.0 BY</a></div> 
                            <div>Icons made by <a href="https://www.flaticon.com/authors/anatoly" title="Anatoly">Anatoly</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" >CC 3.0 BY</a></div>
                            <div>Icons made by <a href="https://www.flaticon.com/authors/epiccoders" title="EpicCoders">EpicCoders</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" >CC 3.0 BY</a></div>
                            <div>Icons made by <a href="https://www.flaticon.com/authors/gregor-cresnar" title="Gregor Cresnar">Gregor Cresnar</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" >CC 3.0 BY</a></div>
                            <div>Icons made by <a href="https://www.flaticon.com/authors/hanan" title="Hanan">Hanan</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>
                        </div>
                    </TriggerListItem>

                    <span className="list-items-block-header">{t("issues")}</span>

                    <TriggerListItem text={t("no-notification")}>
                        <div className="issue-wrapper">
                            {t("no-notification-a")}
                            <button 
                                onClick={this.openSettings}
                                className="text block"
                            >{t("move")}</button>
                            <img 
                                src={require("../../assets/img/issues/issue1.0-" + this.state.lang + ".jpg")}
                                alt="issue"
                            />
                            {t("no-notification-b")}
                            <img 
                                src={require("../../assets/img/issues/issue1.1-" + this.state.lang + ".jpg")}
                                alt="issue"                            
                            />
                            {t("no-notification-c")}                            
                            <img 
                                src={require("../../assets/img/issues/issue1.2-" + this.state.lang + ".jpg")}
                                alt="issue"                            
                            />
                        </div>
                    </TriggerListItem>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state, props) {
    return {
        settings: state.settings
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(About))