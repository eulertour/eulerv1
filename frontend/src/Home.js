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
import patreon from './assets/logos/patreon.png';
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
    alignItems: "center",
    width: "100%",
    backgroundColor: theme.palette.grey[50],
  },
  blockLabel: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "2.5rem",
    fontFamily: "sans-serif",
    letterSpacing: -1,
    margin: "60px 0 10px 0",
  },
  typingBoxes: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    height: 210,
    width: "80%",
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
    backgroundColor: theme.palette.grey[50],
    alignItems: "center",
  },
  links: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    height: "85px",
    width: "65%",
  },
  getStartedButton: {
      borderRadius: "15px",
      width: "200px",
      height: "60px",
      display: "flex",
      fontSize: "1.3rem",
      border: "1px solid #dcdcdc",
      justifyContent: "center",
      alignItems: "center",
      boxSizing: "border-box",
      cursor: "pointer",
      transition: "background-color 0.3s ease-in-out",
  },
  emphaticButton: {
      backgroundColor: "#b43daf",
      color: "white",
      border: "none",
      '&:hover': {
          backgroundColor: "#8c3087",
      }
  },
  getStartedContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      marginTop: "20px",
  },
  getStarted: {

  },
  communityLink: {
      height: "100%",
      boxSizing: "border-box",
  },
  supportBlock: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
  },
  spacer: {
      height: "20px",
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
            typedObj: null,
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
        if (this.state.typedObj) {
            this.state.typedObj.destroy();
        } else {
            document.removeEventListener('scroll', this.trackScrolling);
        }
    }

    trackScrolling = () => {
        if (this.typingBlock.current && window.innerHeight -
            this.typingBlock.current.getBoundingClientRect().top > 150) {
            document.removeEventListener('scroll', this.trackScrolling);
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
               typeSpeed: 10,
               onComplete: () => {this.setState({finishedTyping: true})}
            }

            let typed = new Typed(this.typingDiv.current, options);
            this.setState({typedObj: typed});
            typed.start();
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
                            <NavLink to="/">
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
                            from={"/"}
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
                        <div className={classes.blockLabel}>
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
                                        autoPlay
                                        height={"100%"}
                                    >
                                        <source
                                            src={squareToCircle}
                                            type="video/mp4"
                                        />
                                    </video> :
                                    <img
                                        src={playButton}
                                        height={50}
                                        alt={"play button"}
                                    />
                                }
                            </div>
                        </div>
                        <div className={classes.getStartedContainer}>
                            <NavLink to="/create">
                                <div
                                    className={classNames(
                                    classes.getStartedButton,
                                    classes.emphaticButton)}
                                >
                                    Start using Manim
                                </div>
                            </NavLink>
                        </div>
                    </div>
                    <div className={classes.communityBlock}>
                        <div className={classes.blockLabel}>
                            Join the community
                        </div>
                        <div className={classes.links}>
                            <a
                                href="https://github.com/3b1b/manim"
                                target="_tab"
                                className={classes.communityLink}
                            >
                                <img
                                    src={github}
                                    alt="github logo"
                                    height={"100%"}
                                />
                            </a>
                            <a
                                href="https://www.reddit.com/r/manim"
                                target="_tab"
                                className={classes.communityLink}
                            >
                                <img
                                    src={reddit}
                                    alt="reddit logo"
                                    height={"100%"}
                                />
                            </a>
                            <a
                                href="https://discord.gg/mMRrZQW"
                                target="_tab"
                                className={classes.communityLink}
                            >
                                <img
                                    src={discord}
                                    alt="discord logo"
                                    height={"100%"}
                                />
                            </a>
                        </div>
                    </div>
                    <div className={classes.supportBlock}>
                        <div className={classes.blockLabel}>
                            Show your support
                        </div>
                        <div className={classes.links}>
                            <a
                                href="https://www.patreon.com/eulertour"
                                target="_tab"
                                className={classes.communityLink}
                            >
                                <img
                                    src={patreon}
                                    alt="patreon logo"
                                    height={"100%"}
                                />
                            </a>
                        </div>
                    </div>
                    <div className={classes.spacer}/>
                </div>
            </div>
        );
    }
}
// find a way to size appBarSpacer dynamically

export default withCookies(withStyles(styles, { withTheme: true })(Home));
