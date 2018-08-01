import React, {Component} from 'react';
import moment from "moment";

import arrowRight from '../../media/img/right-grey.svg';
import Logo from '../../media/img/logo.png';

import Header from '../../components/Header/Header';
import { InsetListItem, TriggerListItem } from "../../components/ListItem/ListItem";

import './About.scss';

export default class About extends Component {
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
            alert("Подключитесь к интернету для выполнения действия");
            return 
        }

        window.LaunchReview.launch();
    }

    share = () => {
        if (navigator.connection.type === window.Connection.NONE) {
            alert("Подключитесь к интернету для выподнения действия");
            return 
        }

        window.plugins.socialsharing.share(
            'Ежедневник - заметки и напоминания в удобном виде', 
            'Ежедневник', 
            Logo, 
            'https://ce22s.app.goo.gl/u9DC'
        )
    }

    render () {
        return (
            <div className="page-wrapper">
                <Header />
                <div className="scroll page-content padding">
                    <img 
                        className="app-logo"
                        src={Logo}
                        alt="app-logo"
                    />
                    <div className="text-center">
                        <strong>Ежедневник</strong>
                        <p>&#9400; Mamindeveloper, 2017</p>
                        <p>vadim54787@gmail.com</p>                        
                    </div> 
                    <div className="list-items-block">
                        <InsetListItem 
                            text="Оценить приложение"
                            onClick={this.launthMarket}  
                        />
                        <InsetListItem 
                            text="Поделиться приложением"
                            onClick={this.share}  
                        /> 
                    </div> 
                    <TriggerListItem 
                        text="Использованные ресурсы"
                        onClick={() => this.setDropdownVisible(1)}  
                        triggerValue={this.state.dropdownVisible === 1}
                    />   
                    {  
                        this.state.dropdownVisible &&                   
                        <div>
                            <strong>Графика:</strong>
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