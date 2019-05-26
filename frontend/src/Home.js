import React from 'react';
import classNames from 'classnames';
import { withCookies } from 'react-cookie';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Banner from './components/Banner.jsx';
import logo from './assets/eulertour_logo.png';
import { LoginInfo } from "./components/LoginInfo";
import Typed from 'typed.js';
import * as colors from '@material-ui/core/colors';
import playButton from './assets/button-circle-play@3x.svg';
import squareToCircle from './assets/SquareToCircle.mp4';
import reddit from './assets/logos/reddit.svg';
import github from './assets/logos/github.svg';
import discord from './assets/logos/discord.svg';
import { NavLink } from "react-router-dom";
import { fetchUsernameFromToken } from "./api";

const appBarHeight = 70;
const styles = theme => ({
  root: {
    display: 'flex',
    backgroundColor: theme.palette.grey[50],
    flexDirection: 'column',
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
  },
  blocks: {
    boxShadow: "2px -3px 10px 0 rgba(115, 143, 147, .4)",
  },
  typingBlock: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
    width: "100%",
    backgroundColor: theme.palette.grey[50],
  },
  codingMessage: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "2.5rem",
    fontFamily: "sans-serif",
    letterSpacing: -1,
    margin: "25px 0 10px 0",
  },
  typingBoxes: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    height: 210,
  },
  typeExample: {
    height: "100%",
    width: "400px",
    paddingLeft: 15,
    backgroundColor: "white",
  },
  renderExample: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: "373px",
    backgroundColor: colors.pink[50],
  },
  communityBlock: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
    width: "100%",
    marginTop: "10px",
    marginBottom: "20px",
    backgroundColor: theme.palette.grey[50],
  },
  communityMessage: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "2.5rem",
    fontFamily: "sans-serif",
    letterSpacing: -1,
    margin: "25px 0 10px 0",
  },
  links: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    height: "85px",
  },
});

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.typingDiv = React.createRef();
        this.typingBlock = React.createRef();
        this.video = React.createRef();
        this.state = {
            finishedTyping: false,
        }
    }

    fetchUsername = async accessToken => {
        const response = await fetchUsernameFromToken(accessToken);
        response && this.props.onUsernameReceived(response.data.username);
    }

    componentDidMount() {
        this.fetchUsername(this.props.access);
        document.addEventListener('scroll', this.trackScrolling);
    }

    componentWillUnmount = () => {
        document.removeEventListener('scroll', this.trackScrolling);
    }

    trackScrolling = () => {
        if (window.innerHeight -
            this.typingBlock.current.getBoundingClientRect().top > 150) {
            let options = {
              strings: [`
<code>
<span style="margin-left: 0px" >
  <span style="color: #708">class</span> 
  <span style="color: #00f">SquareToCircle</span>(Scene):
</span><br>
<span style="margin-left: 34px">
  <span style="color: #708">def</span> 
  <span style="color: #00f">construct</span>(self):
</span><br>
<span style="margin-left: 68px">circle = Circle()<br>
<span style="margin-left: 68px">square = Square()<br>
<span style="margin-left: 68px">square.flip(RIGHT)<br>
<span style="margin-left: 68px">square.rotate(-3 * TAU / 8)<br>
<span style="margin-left: 68px">circle.set_fill(PINK, opacity=0.5)<br><br>
<span style="margin-left: 68px">
  <span style="color: #05a">self</span>.play(ShowCreation(square))
</span><br>
<span style="margin-left: 68px">
  <span style="color: #05a">self</span>.play(Transform(square, circle))
</span><br>
<span style="margin-left: 68px">
  <span style="color: #05a">self</span>.play(FadeOut(square))
</span>
</code>
              `],
               typeSpeed: 20,
               onComplete: () => {this.setState({finishedTyping: true})}
            }

            let typed = new Typed(this.typingDiv.current, options);
            typed.start();
            document.removeEventListener('scroll', this.trackScrolling);
        }
    };


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
                            <NavLink to="/home">
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
                            </NavLink>
                        </div>
                        <LoginInfo
                            username={this.props.username}
                            logOut={() => {this.props.onLogOut()}}
                            from={"/home"}
                        />
                    </Toolbar>
                </AppBar>
                <div className={classes.appBarSpacer} />
                <Banner />
                <div className={classes.blocks}>
                    <div
                        className={classes.typingBlock}
                        ref={this.typingBlock}
                    >
                        <div className={classes.codingMessage}>
                            Easy to start
                        </div>
                        <div className={classes.typingBoxes}>
                            <div className={classes.typeExample}>
                                <span ref={this.typingDiv} />
                            </div>
                            <div
                                className={classes.renderExample}
                            >
                                {this.state.finishedTyping ? 
                                    <video
                                        ref={this.video}
                                        src={squareToCircle}
                                        autoPlay
                                        height={"100%"}
                                        type="video/mp4"
                                    /> :
                                    <img src={playButton} height={50} />
                                }
                            </div>
                        </div>
                    </div>
                    <div className={classes.communityBlock}>
                        <div className={classes.communityMessage}>
                            Join the community
                        </div>
                        <div className={classes.links}>
                            <img src={github} alt="github logo" height={"100%"}/>
                            <img src={reddit} alt="reddit logo" height={"100%"}/>
                            <img src={discord} alt="discord logo" height={"100%"}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
// find a way to size appBarSpacer dynamically

export default withCookies(withStyles(styles, { withTheme: true })(Home));
