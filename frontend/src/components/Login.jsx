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
                display_login: this.props.location.pathname === "/login",
                login_errors: [],
                login_username: '',
                login_password: '',

                signup_username: '',
                signup_password: '',
                signup_email: '',
            });
        }
    }

    handleSwitch() {
        if (this.props.controlUrl) {
            this.props.history.push(this.state.display_login ? "/signup" : "/login");
        } else {
            this.setState({
                display_login : !this.state.display_login,
                login_errors: [],
                login_username: '',
                login_password: '',

                signup_username: '',
                signup_password: '',
                signup_email: '',
            });
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
            if ('response' in error &&
                'info' in error.response.data) {
                this.setState({
                    login_errors: error.response.data.info,
                });
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
            this.setState({
                login_errors: error.response.data.info
            });
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

    loginInput(icon, stateVar, extraClasses) {
        let inputType = stateVar.split("_")[1];
        let placeholder = inputType.charAt(0).toUpperCase() + inputType.slice(1);
        return (
            <div
                className={"login-input-container " + (extraClasses === undefined ? "" : extraClasses)}
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
                this.loginInput(passwordIcon, "login_password", "login-last"),
                this.rememberForgot(),
            ];
            acceptText = "Log In";
            acceptFunction = this.logIn;
            switchText = "Don't have an account?";
        } else {
            content = [
                this.loginInput(userIcon, "signup_username"),
                this.loginInput(emailIcon, "signup_email"),
                this.loginInput(passwordIcon, "signup_password", "login-last"),
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
                    <ul className="auth-errors">
                        {this.state.login_errors.map((item, i) =>
                            <li className="auth-error" key={i}>
                                <div className="auth-error-text">
                                    {item}
                                </div>
                            </li>
                        )}
                    </ul>
                </div>
                <div className="login-bottom">
                    <div
                        className="emphatic-button signup-button"
                        onClick={acceptFunction}
                    >{acceptText}</div>
                    <div
                        className="login-switch"
                        onClick={this.handleSwitch}
                    >{switchText}</div>
                </div>
            </div>
        );
    }
}

export default withRouter(withCookies(Login));
