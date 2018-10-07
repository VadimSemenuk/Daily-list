import React, {Component} from "react";
import { BeatLoader } from 'react-spinners';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import * as AppActions from '../../actions'; 

import "./Loader.scss";

class Loader extends Component {
    constructor(props) {
        super(props);

        this.state = { }
    }

    render() {
        return (
            this.props.loader ? 
            <div className="synchronization-loader-wrapper">
                <BeatLoader
                    color={this.props.settings.theme.header}
                    size={8}
                />
            </div>
            :
            null
        );
    }
}

function mapStateToProps(state) {
    return {
        settings: state.settings,
        loader: state.loader
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(AppActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, null)(Loader);