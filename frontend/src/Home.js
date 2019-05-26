import React from 'react';
import classNames from 'classnames';
import { withCookies } from 'react-cookie';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Banner from './components/Banner.jsx';
import logo from './assets/eulertour_logo.png';
import { LoginInfo } from "./components/LoginInfo";

const appBarHeight = 70;
const styles = theme => ({
  root: {
    display: 'flex',
    backgroundColor: theme.palette.grey[50],
    flexDirection: 'column',
    height: 'calc(100vh)',
  },
  appBar: {
    display: 'flex',
    justifyContent: 'center',
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    zIndex: theme.zIndex.drawer + 1,
    minHeight: appBarHeight,
    backgroundColor: theme.palette.grey[50],
    boxShadow: "2px 6px 10px 0 rgba(115, 143, 147, .4)",
  },
  block: {
    display: 'flex',
    minHeight: 40,
  },
  appBarSpacer: {minHeight: appBarHeight},
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
  }
});

class Home extends React.Component {
    render() {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <AppBar
                    position="fixed"
                    className={classes.appBar}
                >
                    <Toolbar
                        classes={{root: classes.toolbar}}
                        disableGutters={true}
                    >
                        <div className="projects-logo-container">
                            <div className="logo-container">
                                <img
                                    className="banner-logo"
                                    src={logo}
                                    alt="EulerTour logo"
                                />
                                <div className="banner-text">
                                    EulerTour
                                    <sup className="release">&alpha;</sup>
                                </div>
                            </div>
                        </div>
                        <LoginInfo
                            username={this.props.username}
                            logOut={this.logOut}
                        />
                    </Toolbar>
                </AppBar>
                <div className={classes.appBarSpacer} />
                <Banner />
            </div>
        );
    }
}
// find a way to size appBarSpacer dynamically

export default withCookies(withStyles(styles, { withTheme: true })(Home));
