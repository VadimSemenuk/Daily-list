import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {translate} from "react-i18next";

import * as AppActions from '../../actions';

import Logo from '../../assets/img/logo.svg';

import Header from '../../components/Header/Header';
import {InsetListItem, TriggerListItem} from "../../components/ListItem/ListItem";

import './About.scss';
import deviceService from "../../services/device.service";

class About extends Component {
    launchMarket = () => {
        if (!deviceService.hasNetworkConnection()) {
            window.plugins.toast.showLongBottom(this.props.t("internet-required"));       
            return 
        }

        window.LaunchReview.launch();
    };

    openSettings() {
        window.cordova.plugins.settings.open(["application_details", true])
    }

    render () {
        let {t} = this.props;

        return (
            <div className="page-wrapper page-about">
                <Header title={t("about")}/>
                <div className="scroll page-content padding">
                    <img
                        className="app-logo"
                        src={Logo}
                        alt="app-logo"
                        onClick={this.onLogoClick}
                    />
                    <div className="text-center">
                        <div><strong>{t("app-name")}</strong></div>
                        <div><span>&#9400; 2017 Mamindeveloper</span></div>
                        <div><a href="mailto:mamindeveloper@gmail.com">mamindeveloper@gmail.com</a></div>
                        <div><a href="https://t.me/VadimSemenyuk" target="_blank">t.me/VadimSemenyuk</a></div>
                    </div>
                    <InsetListItem 
                        text={t("star-app")}
                        onClick={this.launchMarket}
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
                            <div>Icons made by <a href="https://www.flaticon.com/authors/hanan" title="Hanan">Hanan</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0">CC 3.0 BY</a></div>
                            <div>Icons made by <a href="https://www.flaticon.com/authors/google" title="Google">Google</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank" rel="noopener noreferrer">CC 3.0 BY</a></div>
                            <div>Icons made by <a href="https://www.flaticon.com/authors/vaadin" title="Vaadin" rel="noopener noreferrer">Vaadin</a> from <a href="https://www.flaticon.com/" title="Flaticon" rel="noopener noreferrer">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank" rel="noopener noreferrer">CC 3.0 BY</a></div>
                            <div>Icons made by <a href="https://www.flaticon.com/authors/pixel-perfect" title="Pixel perfect">Pixel perfect</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
                            <div>Icons made by <a href="https://www.flaticon.com/authors/iconixar" title="iconixar">iconixar</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
                            <div>Icons made by <a href="https://www.flaticon.com/authors/kiranshastry" title="Kiranshastry">Kiranshastry</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
                        </div>
                    </TriggerListItem>

                    <span className="list-items-block-header">{t("issues")}</span>

                    <TriggerListItem text={t("no-notification")}>
                        <div className="issue-wrapper">{t("no-notification-description")}</div>
                    </TriggerListItem>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        settings: state.settings
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default translate("translations")(connect(mapStateToProps, mapDispatchToProps)(About))