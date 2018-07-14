import React, {Component} from 'react';

import arrowRight from '../../../media/img/right-grey.svg';
import Logo from '../../../media/img/logo.png';

import './About.scss';

export default class About extends Component {
	constructor(props) {
        super(props);
  
        this.state = { }  
    }

    launthMarket = () => {
        if (navigator.connection.type === window.Connection.NONE) {
            alert("Подключитесь к интернету для выподнения действия");
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
            <div className="about-wrapper settings-page-wrapper scroll">
                <div className="setting-item">
                    Developed by mamindeveloper<br />
                    vadim54787@gmail.com<br />
                    Skype: semaster4
                </div> 
                <div className="setting-item-block">
                    <button 
                        className="setting-item touchable"
                        onClick={this.launthMarket}
                    >
                        <span className="setting-item-text">Оценить приложение</span>
                        <img 
                            className="setting-item-img"
                            src={arrowRight} 
                            alt="in"                        
                        /> 
                    </button>  
                    <button 
                        className="setting-item touchable"
                        onClick={this.share}
                    >
                        <span className="setting-item-text">Поделиться приложением</span>
                        <img 
                            className="setting-item-img"
                            src={arrowRight} 
                            alt="in"                        
                        /> 
                    </button>  
                </div>                            
                <div className="setting-item copyright">
                    <strong>App icons:</strong>
                    <div>Icons made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0">CC 3.0 BY</a></div>           
                    <div>Icons made by <a href="http://www.flaticon.com/authors/madebyoliver" title="Madebyoliver">Madebyoliver</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" >CC 3.0 BY</a></div>
		            <div>Icons made by <a href="http://www.flaticon.com/authors/chris-veigt" title="Chris Veigt">Chris Veigt</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" >CC 3.0 BY</a></div>
		            <div>Icons made by <a href="https://www.flaticon.com/authors/lucy-g" title="Lucy G">Lucy G</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" >CC 3.0 BY</a></div>
                    <div>Icons made by <a href="https://www.flaticon.com/authors/smashicons" title="Smashicons">Smashicons</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" >CC 3.0 BY</a></div> 
                    <div>Icons made by <a href="https://www.flaticon.com/authors/anatoly" title="Anatoly">Anatoly</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" >CC 3.0 BY</a></div>
                    <div>Icons made by <a href="https://www.flaticon.com/authors/epiccoders" title="EpicCoders">EpicCoders</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" >CC 3.0 BY</a></div>
                    <div>Icons made by <a href="https://www.flaticon.com/authors/gregor-cresnar" title="Gregor Cresnar">Gregor Cresnar</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" >CC 3.0 BY</a></div>
                    <strong>Main app icon: </strong>
                    <div>Icons made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" >CC 3.0 BY</a></div><br />
                </div>
            </div>
        );
    }
}