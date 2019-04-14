import React from 'react';
import classNames from 'classnames';
import { withCookies } from 'react-cookie';
import { withStyles } from '@material-ui/core/styles';
import logo from './assets/etourlogo.jpg';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import TextField from '@material-ui/core/TextField';
import PropTypes from 'prop-types';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import { fade } from '@material-ui/core/styles/colorManipulator';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActionArea from '@material-ui/core/CardActionArea';


const drawerWidth = 260;
const styles = theme => ({
  root: {
    display: 'flex',
    backgroundColor: theme.palette.grey[100],
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
    minHeight: 70,
    backgroundColor: theme.palette.common.white,
    boxShadow: "2px 6px 10px 0 rgba(115, 143, 147, .4)",
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: drawerWidth,
  },
  menuButton: {
    padding: 12,
  },
  hide: {
    display: 'none',
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    ...theme.mixins.toolbar,
    justifyContent: 'space-between',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.unit * 3,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: 0,
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: drawerWidth,
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },
  search: {
    position: 'relative',
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing.unit,
      width: 'auto',
    },
  },
  searchIcon: {
    width: theme.spacing.unit * 9,
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.common.black,
  },
  inputRoot: {
    width: '100%',
  },
  inputInput: {
    paddingTop: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit * 10,
    transition: theme.transitions.create('width'),
    width: '100%',
  },
  toolbar: {
      display: 'flex',
      justifyContent: 'space-around',
      ...theme.mixins.toolbar,
  },
  colorBlack: {
    color: theme.palette.common.black,
  },
  card: {
    height: '100%',
    width: '100%',
    padding: 0,
  },
  list: {
    backgroundColor: theme.palette.background.paper,
  }
});

class Projects extends React.Component {
    state = {
        drawerOpen: false,
        sharedProjects: true,
        projects: [],
        searchInput: '',
    }

    chooseProject = (name) => {
        alert('chose ' + name);
    }

    handleDrawerToggle = () => {
        this.setState({drawerOpen: !this.state.drawerOpen});
    }

    checkSearch = (e) => {
        if (e.keyCode === 13) {
            alert('search ' + this.state.searchInput);
        }
    }

    render() {
        const { classes } = this.props;
        const { drawerOpen, sharedProjects, projects, searchInput } = this.state;
        return (
            <div className={classes.root}>
                <AppBar
                    position="fixed"
                    className={classes.appBar}
                >
                    <Toolbar
                        className={classes.toolbar}
                        disableGutters={true}
                    >
                        <div className="projects-logo-container">
                            <div className="logo-container">
                                <IconButton
                                    color="default"
                                    aria-label="Open drawer"
                                    onClick={this.handleDrawerToggle}
                                    className={classes.menuButton}
                                    classes={{
                                        label: classes.colorBlack,
                                    }}
                                >
                                    <MenuIcon />
                                </IconButton>
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
                       <div className={classes.search}>
                         <div className={classes.searchIcon}>
                           <SearchIcon/>
                         </div>
                         <TextField
                           variant="outlined"
                           value={searchInput}
                           onKeyDown={this.checkSearch}
                           onChange={(e) => this.setState({searchInput: e.target.value})}
                           InputProps={{
                             placeholder:"Search…",
                             classes:{
                               root: classes.inputRoot,
                               input: classes.inputInput,
                             }
                           }}
                         />
                       </div>
                    </Toolbar>
                </AppBar>
                <div
                    className={classNames(classes.content, {
                        [classes.contentShift]: drawerOpen,
                    })}
                >
                    <div className={classes.drawerHeader} />
                    {sharedProjects ? "shared projects" : "your projects"}
                    <List classes={{root: classes.list}}>
                      {projects.map(projectName => (
                        <ListItem
                          button
                          divider
                          key={projectName}
                          onClick={() => {this.chooseProject(projectName)}}>
                          {projectName}
                        </ListItem>)
                      )}
                    </List>
                </div>
                <Drawer
                    variant="persistent"
                    anchor="left"
                    open={drawerOpen}
                    classes={{
                        paper: classes.drawerPaper,
                    }}
                >
                    <div className={classes.toolbar} />
                    <List>
                      <ListItem
                        button
                        key={"yourprojects"}
                        onClick={() => {this.setState({sharedProjects: false})}}
                      >
                        <ListItemIcon><InboxIcon /></ListItemIcon>
                        <ListItemText variant="h3" primary={"Your Projects"} />
                      </ListItem>
                      <ListItem
                        button
                        key={"sharedprojects"}
                        onClick={() => {this.setState({sharedProjects: true})}}
                      >
                        <ListItemIcon><InboxIcon /></ListItemIcon>
                        <ListItemText variant="h3" primary={"Shared Projects"} />
                      </ListItem>
                    </List>
                </Drawer>
            </div>
        );
    }
}

Projects.propTypes = {
  theme: PropTypes.object.isRequired,
};

export default withCookies(withStyles(styles, { withTheme: true })(Projects));
