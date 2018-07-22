import React, {Component} from 'react';

import './SettingsPassword.scss';

export default class SettingsPassword extends Component {
	constructor(props) {
        super(props);
  
        this.state = {
            password0: '',
            password1: ''            
        }  
    }

    validatePassword() {
        if (this.state.password0 !== this.state.password1) {
            alert('Пароли в полях не совпадают');
        } else if (~this.state.password0.indexOf(' ')) {
            alert('В пароле нельзя использовать пробел');
        } else if (this.state.password0.length < 4) {
            alert('Введите минимум 4 символа');            
        } else {
            return true;
        }
        return false;
    }

    onPassSet = () => {
        if (this.validatePassword()) {
            this.props.location.state.onValueSet(this.state.password0);
            this.props.history.goBack();
        };
    }

    render () {
        return (
            <div className="settings-password-wrapper scroll">
                <input
                    type="password"
                    placeholder="Введите новый пароль"
                    onChange={(e) => this.setState({password0: e.target.value})}
                />
                <input
                    type="password"
                    placeholder="Введите пароль повторно"
                    onChange={(e) => this.setState({password1: e.target.value})}
                />                
                <button 
                    className="text"
                    onClick={this.onPassSet}
                >Сохранить</button>       
            </div>
        );
    }
}