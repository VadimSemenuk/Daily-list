import React, {Component} from 'react';
import {translate, Trans} from "react-i18next";

import Logo from '../../assets/img/logo.png';

import Header from '../../components/Header/Header';
import {InsetListItem, TriggerListItem} from "../../components/ListItem/ListItem";

import './About.scss';

class About extends Component {
	constructor(props) {
        super(props);
  
        this.state = {
            dropdownVisible: false
        }  
    }

    setDropdownVisible = (dropdownVisible) => {
        if (this.state.dropdownVisible === dropdownVisible) {
            dropdownVisible = false;
        }
        this.setState({
            dropdownVisible
        })
    }

    launthMarket = () => {
        if (navigator.connection.type === window.Connection.NONE) {
            window.plugins.toast.showLongBottom(this.props.t("internet-required"));       
            return 
        }

        window.LaunchReview.launch();
    }

    share = () => {
        if (navigator.connection.type === window.Connection.NONE) {
            window.plugins.toast.showLongBottom(this.props.t("internet-required"));       
            return 
        }

        window.plugins.socialsharing.share(
            this.props.t("share-content"), 
            this.props.t("share-theme"), 
            Logo, 
            'https://ce22s.app.goo.gl/u9DC'
        )
    }

    render () {
        let {t} = this.props;

        return (
            <div className="page-wrapper">
                <Header title={t("about")}/>
                <div className="scroll page-content padding">
                    <img 
                        className="app-logo"
                        src={Logo}
                        alt="app-logo"
                    />
                    <div className="text-center">
                        <strong>{t("app-name")}</strong>
                        <p>&#9400; 2017 Mamindeveloper</p>
                        <p>mamindeveloper@gmail.com</p>                        
                    </div> 
                    <InsetListItem 
                        text={t("star-app")}
                        onClick={this.launthMarket}  
                    />
                    <InsetListItem 
                        text={t("share-app")}
                        onClick={this.share}  
                    /> 
                    <TriggerListItem 
                        text={t("resources")}
                        onClick={() => this.setDropdownVisible(1)}  
                        triggerValue={this.state.dropdownVisible === 1}
                    />   

                    {/* <span className="list-items-block-header">{t("issues")}</span> */}

                    {  
                        this.state.dropdownVisible &&                   
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
                        </div>
                    }
                </div>
            </div>
        );
    }
}

export default translate("translations")(About)