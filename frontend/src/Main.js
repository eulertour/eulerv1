import React from 'react';
import { Route, BrowserRouter, Switch } from 'react-router-dom';
import { withCookies, CookiesProvider } from 'react-cookie';
import App from './App.js';
import LoginPage from './LoginPage.js';
import Home from './Home.js';
import Projects from './Projects.js';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme({
    palette: {
        primary: {
            main: "#b43daf",
            light: "#c363bf",
            dark: "#7d2a7a",
        },
    },
    typography: { useNextVariants: true },
});

class Main extends React.Component {
    constructor(props, context) {
        super(props, context);
        const { cookies } = props;
        this.state = {
            access: cookies.get('access') || '',
            refresh: cookies.get('refresh') || '',
            username: '',
            project: '',
        }
        this.handleAuth = this.handleAuth.bind(this);
        this.handleLogOut = this.handleLogOut.bind(this);
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

    handleFetchUsername = (username)  => {
        this.setState({username: username});
    }

    handleNewProject = (project) => {
        console.log(project);
        this.setState({project: project});
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
                            project={this.state.project}
                            onLogOut={this.handleLogOut}
                            onAuth={this.handleAuth}
                            onFetchUsername={this.handleFetchUsername}
                            onNewProject={this.handleNewProject}
                        />
                    }/>
                    <Route path="/projects" render={() =>
                        <MuiThemeProvider theme={theme}>
                            <Projects
                                access={this.state.access}
                                refresh={this.state.refresh}
                                onNewProject={this.handleNewProject}
                            />
                        </MuiThemeProvider>
                    }/>
                </Switch>
            </BrowserRouter>
            </CookiesProvider>
        );
    }
}

export default withCookies(Main);
