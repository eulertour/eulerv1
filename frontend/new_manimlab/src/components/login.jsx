import { withCookies } from 'react-cookie';
import React from 'react';
import logo from '../assets/etourlogo.jpg';
import userIcon from '../assets/icon-name@3x.svg';
import emailIcon from '../assets/icon-email@3x.svg';
import passwordIcon from '../assets/icon-password@3x.svg';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import * as consts from '../constants.js';

class Login extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            login_username: '',
            login_password: '',

            signup_username: '',
            signup_password: '',
            signup_email: '',

            display_login: this.props.loginFirst || false,
            login_errors: [],
        };
        this.logIn = this.logIn.bind(this);
        this.signUp = this.signUp.bind(this);
        this.loginInput = this.loginInput.bind(this);
        this.handleSwitch = this.handleSwitch.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (this.props.controlUrl && this.props.location !== prevProps.location) {
            this.setState({
                display_login: this.props.location.pathname === "/login"
            });
        }
    }

    handleSwitch() {
        if (this.props.controlUrl) {
            this.props.history.push(this.state.display_login ? "/signup" : "/login");
        } else {
            this.setState({display_login : !this.state.display_login});
        }
    }

    logIn() {
        axios.post(
            consts.LOGIN_URL,
            {
                username: this.state.login_username,
                password: this.state.login_password,
            },
        )
        .then(response => {
            this.props.onAuth(response);
        })
        .catch(error => {
            console.log(error.data);
            this.setState({
                login_errors: ['oops'],
            });
            if (error.response) {
                console.log(error.response.data);
            } else if (error.request) {
                console.log('Server failed to respond');
            } else {
                console.log('Failed to create request:', error.message);
            }
        });
    }

    signUp() {
        axios({
            method: 'post',
            url: consts.SIGNUP_URL,
            data: {
                username: this.state.signup_username,
                email: this.state.signup_email,
                password: this.state.signup_password,
            }
        })
        .then(response => {
            this.props.onAuth(response);
        })
        .catch(error => {
            console.log(error.response);
            console.log(error);
        });
    }

    rememberForgot() {
        // TODO: implement this
        return (
            <div className="remember-forgot" key="remember_forgot">
                <div style={{display: 'none'}}><input type="checkbox" />Remember me</div>
                <div style={{display: 'none'}}>Forgot your password?</div>
            </div>
        );
    }

    loginInput(icon, stateVar) {
        let inputType = stateVar.split("_")[1];
        let placeholder = inputType.charAt(0).toUpperCase() + inputType.slice(1);
        return (
            <div
                className="login-input-container"
                key={stateVar}
            >
                <div className="icon-container">
                    <img
                        className="login-icon"
                        src={icon}
                        alt={stateVar.replace("_", " ")}
                    />
                </div>
                <input
                    className="login-input"
                    type={stateVar.split("_")[1] === "password" ?
                        "password" : "text"}
                    placeholder={placeholder}
                    value={this.state[stateVar]}
                    onChange={(event) => {
                        this.setState({[stateVar]: event.target.value});
                    }}
                />
            </div>
        );
    }

    render() {
        let content, acceptText, acceptFunction, switchText;
        if (this.state.display_login) {
            content = [
                this.loginInput(userIcon, "login_username"),
                this.loginInput(passwordIcon, "login_password"),
                this.rememberForgot(),
            ];
            acceptText = "Log In";
            acceptFunction = this.logIn;
            switchText = "Don't have an account?";
        } else {
            content = [
                this.loginInput(userIcon, "signup_username"),
                this.loginInput(emailIcon, "signup_email"),
                this.loginInput(passwordIcon, "signup_password"),
            ];
            acceptText = "Sign Up";
            acceptFunction = this.signUp;
            switchText = "Already have an account?";
        }
        return (
            <div className="login-signup">
                <div className="login-top">
                    <img
                        className="login-logo"
                        src={logo}
                        alt="EulerTour logo"
                    />
                    <div className="login-text">EulerTour</div>
                    {content}
                    <div
                        className="emphatic-button signup-button"
                        onClick={acceptFunction}
                    >
                        {acceptText}
                    </div>
                </div>
                <div
                    className="login-bottom"
                    onClick={this.handleSwitch}
                >
                    {switchText}
                </div>
            </div>
        );
    }
    // <ul>
    //     {this.state.login_errors.map((item, i) => <li key={i}>{item}</li>)}
    // </ul>
}

export default withRouter(withCookies(Login));
