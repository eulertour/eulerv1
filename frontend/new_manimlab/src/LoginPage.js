import React from 'react';
import { withRouter, Redirect } from 'react-router-dom';
import { withCookies } from 'react-cookie';
import Login from './components/login.jsx';

class LoginPage extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = {

        };
    }

    render() {
        let from = "/";
        if (this.props.location.state !== undefined &&
            this.props.location.state.from !== undefined) {
            from = this.props.location.state.from;
        }
        if (this.props.access.length !== 0) {
            return <Redirect to={{pathname: from}} />;
        }
        return (
            <div className="login-page">
                <Login
                    controlUrl={true}
                    loginFirst={this.props.loginFirst}
                    onAuth={this.props.onAuth}
                />
            </div>
        );
    }
}

export default withRouter(withCookies(LoginPage));
