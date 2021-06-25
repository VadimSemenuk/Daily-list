import React, {PureComponent} from 'react';

import ChevronBottomImg from "../../assets/img/bottom-chevron.svg";

import './Expandable.scss';

class Expandable extends PureComponent {
    constructor(props) {
        super(props);
    }

    onExpandTrigger = () => {
        this.props.onExpandTrigger(!this.props.isExpanded);
    }

    render() {
        return (
            <div className="expandable-wrapper">
                <div className="expandable-control-wrapper">
                    {this.props.component}
                    <button
                        className="expand-trigger"
                        onClick={this.onExpandTrigger}
                    >
                        <img
                            className={this.props.isExpanded ? 'rotated' : ''}
                            src={ChevronBottomImg}
                            alt="trigger"
                        />
                    </button>
                </div>
                {this.props.isExpanded && this.props.expandableComponent}
            </div>
        )
    }
}

export default Expandable;