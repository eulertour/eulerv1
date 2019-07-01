import React from "react";
import { Route, BrowserRouter, Switch } from "react-router-dom";
import { withCookies, CookiesProvider } from "react-cookie";
import App from "./App.js";
import LoginPage from "./LoginPage.js";
import Home from "./Home.js";
import Projects from "./Projects.js";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import JsLab from "./JsLab.js";

const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#b43daf",
      light: "#f8a5ff",
      dark: "#9245ab"
    },
    secondary: {
      main: "#79e7f3",
      light: "#afffff",
      dark: "#40b5c0"
    }
  },
  typography: { useNextVariants: true }
});

class Main extends React.Component {
  constructor(props, context) {
    super(props, context);
    const { cookies } = props;
    this.state = {
      access: cookies.get("access") || "",
      refresh: cookies.get("refresh") || "",
      username: "",
      projectName: "",
      projectOwner: "",
      projectIsShared: ""
    };
    this.handleAuth = this.handleAuth.bind(this);
    this.handleLogOut = this.handleLogOut.bind(this);
    this.handleUsernameReceived = this.handleUsernameReceived.bind(this);
  }

  handleAuth(jwtResponse) {
    const { cookies } = this.props;
    cookies.set("access", jwtResponse.data.access);
    cookies.set("refresh", jwtResponse.data.refresh);
    this.setState({
      access: jwtResponse.data.access,
      refresh: jwtResponse.data.refresh,
      username: jwtResponse.data.username
    });
  }

  handleUsernameReceived(username) {
    this.setState({ username: username });
  }

  handleNewProject = (projectName, projectOwner, projectIsShared) => {
    this.setState({
      projectName: projectName,
      projectOwner: projectOwner,
      projectIsShared: projectIsShared
    });
  };

  handleLogOut() {
    const { cookies } = this.props;
    cookies.remove("access");
    cookies.remove("refresh");
    this.setState({
      access: "",
      refresh: "",
      username: "",
      projectName: "",
      projectOwner: "",
      projectIsShared: ""
    });
  }

  render() {
    return (
      <MuiThemeProvider theme={theme}>
        <CookiesProvider>
          <BrowserRouter>
            <Switch>
              <Route
                exact
                path="/"
                render={() => (
                  <Home
                    access={this.state.access}
                    refresh={this.state.refresh}
                    username={this.state.username}
                    onLogOut={this.handleLogOut}
                    onAuth={this.handleAuth}
                    onUsernameReceived={this.handleUsernameReceived}
                  />
                )}
              />
              <Route
                path="/login"
                render={() => (
                  <LoginPage
                    access={this.state.access}
                    refresh={this.state.refresh}
                    onAuth={this.handleAuth}
                    controlUrl={true}
                    loginFirst={true}
                    location={{
                      state: { from: "/" }
                    }}
                  />
                )}
              />
              <Route
                path="/signup"
                render={() => (
                  <LoginPage
                    access={this.state.access}
                    refresh={this.state.refresh}
                    onAuth={this.handleAuth}
                    controlUrl={true}
                    loginFirst={false}
                    location={{
                      state: { from: "/" }
                    }}
                  />
                )}
              />
              <Route
                path="/create"
                render={() => (
                  <App
                    access={this.state.access}
                    refresh={this.state.refresh}
                    username={this.state.username}
                    projectName={this.state.projectName}
                    projectOwner={this.state.projectOwner}
                    projectIsShared={this.state.projectIsShared}
                    onLogOut={this.handleLogOut}
                    onAuth={this.handleAuth}
                    onUsernameReceived={this.handleUsernameReceived}
                    onNewProject={this.handleNewProject}
                  />
                )}
              />
              <Route
                path="/projects"
                render={() => (
                  <MuiThemeProvider theme={theme}>
                    <Projects
                      access={this.state.access}
                      refresh={this.state.refresh}
                      username={this.state.username}
                      onLogOut={this.handleLogOut}
                      onNewProject={this.handleNewProject}
                      onUsernameReceived={this.handleUsernameReceived}
                    />
                  </MuiThemeProvider>
                )}
              />
              <Route
                path="/jslab"
                render={() => (
                  <MuiThemeProvider theme={theme}>
                    <JsLab />
                  </MuiThemeProvider>
                )}
              />
            </Switch>
          </BrowserRouter>
        </CookiesProvider>
      </MuiThemeProvider>
    );
  }
}

export default withCookies(Main);
