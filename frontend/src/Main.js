import React from 'react';
import { Route, BrowserRouter, Switch } from 'react-router-dom';
import { withCookies, CookiesProvider } from 'react-cookie';
import App from './App.js';
import LoginPage from './LoginPage.js';
import Home from './Home.js';
import Projects from './Projects.js';

class Main extends React.Component {
    constructor(props, context) {
        super(props, context);
        const { cookies } = props;
        this.state = {
            access: cookies.get('access') || '',
            refresh: cookies.get('refresh') || '',
            username: '',
        }
        this.handleAuth = this.handleAuth.bind(this);
        this.handleLogOut = this.handleLogOut.bind(this);
        this.handleSessionRestore = this.handleSessionRestore.bind(this);
    }

    handleAuth(jwtResponse) {
        const { cookies } = this.props;
        cookies.set('access', jwtResponse.data.access);
        cookies.set('refresh', jwtResponse.data.refresh);
        this.setState({
            access: jwtResponse.data.access,
            refresh: jwtResponse.data.refresh,
            username: jwtResponse.data.username,
        });
    }

    handleSessionRestore(username) {
        this.setState({username: username});
    }

    handleLogOut() {
        const { cookies } = this.props;
        cookies.remove('access');
        cookies.remove('refresh');
        this.setState({
            access: '',
            refresh: '',
            username: '',
        });
    }

    render() {
        return (
            <CookiesProvider>
            <BrowserRouter>
                <Switch>
                    <Route path="/home" render={() => <Home />}/>
                    <Route path="/login" render={() =>
                        <LoginPage
                            access={this.state.access}
                            refresh={this.state.refresh}
                            onAuth={this.handleAuth}
                            controlUrl={true}
                            loginFirst={true}
                            location={{
                                state: {from: "/"}
                            }}
                        />
                    }/>
                    <Route path="/signup" render={() =>
                        <LoginPage 
                            access={this.state.access}
                            refresh={this.state.refresh}
                            onAuth={this.handleAuth}
                            controlUrl={true}
                            loginFirst={false}
                            location={{
                                state: {from: "/"}
                            }}
                        />
                    }/>
                    <Route exact path="/" render={() =>
                        <App
                            access={this.state.access}
                            refresh={this.state.refresh}
                            username={this.state.username}
                            onLogOut={this.handleLogOut}
                            onAuth={this.handleAuth}
                            onSessionRestore={this.handleSessionRestore}
                        />
                    }/>
                    <Route path="/projects" render={() => <Projects />}/>
                </Switch>
            </BrowserRouter>
            </CookiesProvider>
        );
    }
}

export default withCookies(Main);
