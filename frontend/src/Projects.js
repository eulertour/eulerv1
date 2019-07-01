import React from "react";
import classNames from "classnames";
import { withCookies } from "react-cookie";
import { withStyles } from "@material-ui/core/styles";
import logo from "./assets/etourlogo.jpg";
import Drawer from "@material-ui/core/Drawer";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import TextField from "@material-ui/core/TextField";
import PropTypes from "prop-types";
import MenuIcon from "@material-ui/icons/Menu";
import SearchIcon from "@material-ui/icons/Search";
import { fade } from "@material-ui/core/styles/colorManipulator";
import { Redirect, NavLink } from "react-router-dom";
import { fetchProjects, shareProject, deleteProject } from "./api";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import CloudDownloadIcon from "@material-ui/icons/CloudDownload";
import OpenInBrowserIcon from "@material-ui/icons/OpenInBrowser";
import { ShareProjectModal } from "./components/ShareProjectModal";
import DeleteIcon from "@material-ui/icons/Delete";
import PersonIcon from "@material-ui/icons/Person";
import GroupIcon from "@material-ui/icons/Group";
import { DeleteProjectModal } from "./components/DeleteProjectModal";
import { LoginInfo } from "./components/LoginInfo";

const drawerWidth = 260;
const appBarHeight = 70;
const styles = theme => ({
  root: {
    display: "flex",
    backgroundColor: theme.palette.grey[100],
    height: "calc(100vh)"
  },
  appBar: {
    display: "flex",
    justifyContent: "center",
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    zIndex: theme.zIndex.drawer + 1,
    minHeight: appBarHeight,
    backgroundColor: theme.palette.common.white,
    boxShadow: "2px 6px 10px 0 rgba(115, 143, 147, .4)"
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginLeft: drawerWidth
  },
  menuButton: {
    padding: 12,
    marginLeft: 5
  },
  hide: {
    display: "none"
  },
  drawerPaper: {
    width: drawerWidth
  },
  content: {
    flexGrow: 1,
    paddingLeft: theme.spacing.unit * 3,
    paddingRight: theme.spacing.unit * 3,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    marginLeft: 0,
    marginTop: 20
  },
  contentShift: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginLeft: drawerWidth
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit
  },
  search: {
    display: "none",
    position: "relative",
    backgroundColor: fade(theme.palette.common.white, 0.15),
    "&:hover": {
      backgroundColor: fade(theme.palette.common.white, 0.25)
    },
    marginLeft: 0,
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing.unit,
      width: "auto"
    }
  },
  searchIcon: {
    width: theme.spacing.unit * 9,
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.palette.common.black
  },
  inputRoot: {
    width: "100%"
  },
  inputInput: {
    paddingTop: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit * 10,
    transition: theme.transitions.create("width"),
    width: "100%"
  },
  appBarSpacer: {
    height: appBarHeight
  },
  colorBlack: {
    color: theme.palette.common.black
  },
  card: {
    height: "100%",
    width: "100%",
    padding: 0
  },
  drawerList: {
    backgroundColor: theme.palette.background.paper
  },
  contentListRoot: {
    paddingTop: 0
  },
  projectItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 16px 4px 16px"
  },
  projectItemButton: {
    // padding: '8px',
  },
  projectsLogoContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "start",
    alignItems: "center",
    marginRight: "50px"
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between"
  }
});

class Projects extends React.Component {
  state = {
    drawerOpen: false,
    sharedProjects: false,
    projects: [],
    owners: [],
    searchInput: "",
    redirectToLab: false,
    showShareProjectModal: false,
    showDeleteProjectModal: false,
    shareName: "",
    selectedProject: ""
  };

  chooseProject = (projectName, projectOwner, projectIsShared) => {
    this.props.onNewProject(projectName, projectOwner, projectIsShared);
    this.setState({ redirectToLab: true });
  };

  handleDrawerToggle = () => {
    this.setState({ drawerOpen: !this.state.drawerOpen });
  };

  checkSearch = e => {
    if (e.keyCode !== 13) {
      return;
    }
  };

  fetchProjects = async accessToken => {
    const response = await fetchProjects(
      accessToken,
      this.state.sharedProjects ? 1 : 0
    );
    response &&
      this.setState({
        projects: response.data.projects,
        owners: response.data.owners
      });
    this.props.onUsernameReceived(response.data.username);
    console.log(this.state.projects);
  };

  componentDidUpdate = async (prevProps, prevState) => {
    if (this.state.sharedProjects !== prevState.sharedProjects) {
      this.fetchProjects(this.props.access);
    }
  };

  componentDidMount() {
    if (this.props.access.length > 0) {
      this.fetchProjects(this.props.access);
    } else {
      this.setState({ sharedProjects: true });
    }
  }

  handleModalClick = event => {
    if ("closeonclick" in event.target.attributes) {
      this.setState({
        showShareProjectModal: false,
        showProjectDeleteModal: false,
        selectedProject: "",
        shareName: ""
      });
    }
  };

  handleShareNameChange = event => {
    this.setState({ shareName: event.target.value });
  };

  handleCopyProject = async (
    sourceProjectName,
    sourceProjectOwner,
    sourceProjectShared,
    destProjectName
  ) => {
    const response = await shareProject(
      this.props.access,
      sourceProjectName,
      sourceProjectOwner,
      sourceProjectShared,
      destProjectName
    );
    this.setState({ showShareProjectModal: false });
  };

  deleteOwnedProject = async (projectName, projectShared) => {
    console.log("deleting " + projectName);
    const response = await deleteProject(
      this.props.access,
      projectName,
      projectShared
    );
    this.setState({ showProjectDeleteModal: false });
    response && this.fetchProjects(this.props.access);
  };

  render() {
    const { classes } = this.props;
    const { drawerOpen, sharedProjects, projects, searchInput } = this.state;
    if (this.state.redirectToLab) {
      return <Redirect to={{ pathname: "/create" }} push={true} />;
    }
    return (
      <div className={classes.root}>
        <AppBar position="fixed" className={classes.appBar}>
          <Toolbar classes={{ root: classes.toolbar }} disableGutters={true}>
            <div className={classes.projectsLogoContainer}>
              <IconButton
                color="default"
                aria-label="Open drawer"
                onClick={this.handleDrawerToggle}
                className={classes.menuButton}
                classes={{
                  label: classes.colorBlack
                }}
              >
                <MenuIcon />
              </IconButton>
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
            <div className={classes.search}>
              <div className={classes.searchIcon}>
                <SearchIcon />
              </div>
              <TextField
                variant="outlined"
                value={searchInput}
                onKeyDown={this.checkSearch}
                onChange={e => this.setState({ searchInput: e.target.value })}
                InputProps={{
                  placeholder: "Search…",
                  classes: {
                    root: classes.inputRoot,
                    input: classes.inputInput
                  }
                }}
              />
            </div>
            <LoginInfo
              username={this.props.username}
              logOut={() => {
                this.props.onLogOut();
                this.fetchProjects("");
              }}
              from={"/projects"}
            />
          </Toolbar>
        </AppBar>
        <div
          className={classNames(classes.content, {
            [classes.contentShift]: drawerOpen
          })}
        >
          <div className={classes.appBarSpacer} />
          {sharedProjects
            ? "shared projects"
            : "your projects (" +
              (this.props.username.length > 0 ? this.props.username : "guest") +
              ")"}
          <List
            className={classes.drawerList}
            classes={{ root: classes.contentListRoot }}
          >
            {projects.map((projectName, index) => (
              <ListItem
                classes={{ root: classes.projectItem }}
                divider
                key={projectName}
              >
                {projectName +
                  (this.state.sharedProjects
                    ? " by " + this.state.owners[index]
                    : "")}
                <div className={classes.projectItemButtons}>
                  <ListItemIcon>
                    <IconButton
                      className={classes.projectItemButton}
                      onClick={() => {
                        this.chooseProject(
                          projectName,
                          this.state.owners[index],
                          this.state.sharedProjects
                        );
                      }}
                    >
                      <OpenInBrowserIcon />
                    </IconButton>
                  </ListItemIcon>
                  {this.state.sharedProjects ? (
                    this.props.username.length > 0 ? (
                      <ListItemIcon>
                        <IconButton
                          className={classes.projectItemButton}
                          onClick={() => {
                            this.setState({
                              showShareProjectModal: true,
                              selectedProject: projectName,
                              projectOwner: this.state.owners[index]
                            });
                          }}
                        >
                          <CloudDownloadIcon />
                        </IconButton>
                      </ListItemIcon>
                    ) : null
                  ) : (
                    <ListItemIcon>
                      <IconButton
                        className={classes.projectItemButton}
                        onClick={() => {
                          this.setState({
                            showShareProjectModal: true,
                            selectedProject: projectName,
                            projectOwner: this.state.owners[index]
                          });
                        }}
                      >
                        <CloudUploadIcon />
                      </IconButton>
                    </ListItemIcon>
                  )}
                  {this.props.username === this.state.owners[index] && (
                    <ListItemIcon>
                      <IconButton
                        className={classes.projectItemButton}
                        onClick={() => {
                          this.setState({
                            showProjectDeleteModal: true,
                            selectedProject: projectName
                          });
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemIcon>
                  )}
                </div>
              </ListItem>
            ))}
          </List>
        </div>
        <Drawer
          variant="persistent"
          anchor="left"
          open={drawerOpen}
          classes={{
            paper: classes.drawerPaper
          }}
        >
          <div className={classes.appBarSpacer} />
          <List className={classes.drawerList}>
            <ListItem
              button
              key={"yourprojects"}
              onClick={() => {
                if (this.state.sharedProjects) {
                  this.setState({
                    sharedProjects: false,
                    projects: []
                  });
                }
              }}
            >
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText variant="h3" primary={"Your Projects"} />
            </ListItem>
            <ListItem
              button
              key={"sharedprojects"}
              onClick={() => {
                if (!this.state.sharedProjects) {
                  this.setState({
                    sharedProjects: true,
                    projects: []
                  });
                }
              }}
            >
              <ListItemIcon>
                <GroupIcon />
              </ListItemIcon>
              <ListItemText variant="h3" primary={"Shared Projects"} />
            </ListItem>
          </List>
        </Drawer>
        {this.state.showShareProjectModal && (
          <ShareProjectModal
            shareName={this.state.shareName}
            onModalClick={this.handleModalClick}
            onShareProject={() => {
              this.handleCopyProject(
                this.state.selectedProject,
                this.state.projectOwner,
                this.state.sharedProjects,
                this.state.shareName
              );
              this.setState({ shareName: "" });
            }}
            onShareNameChange={this.handleShareNameChange}
            shared={this.state.sharedProjects}
          />
        )}
        {this.state.showProjectDeleteModal && (
          <DeleteProjectModal
            onModalClick={this.handleModalClick}
            onDeleteProject={() => {
              this.deleteOwnedProject(
                this.state.selectedProject,
                this.state.sharedProjects
              );
            }}
          />
        )}
      </div>
    );
  }
}

Projects.propTypes = {
  theme: PropTypes.object.isRequired
};

export default withCookies(withStyles(styles, { withTheme: true })(Projects));
