import "antd/dist/antd.css";
import "./App.css";
import React from "react";
import { withRouter, NavLink } from "react-router-dom";
import { instanceOf } from "prop-types";
import { withCookies, Cookies } from "react-cookie";
import NotVideo from "./components/NotVideo.jsx";
import * as consts from "./constants.js";
import Editor from "./components/Editor.jsx";
import logo from "./assets/etourlogo.jpg";
import {
    deleteProject,
    deleteFile,
    newFileName,
    saveProject,
    checkRenderStatus,
    getFileContents,
    getDirectoryContents,
    postRender,
    fetchRestoreSession
} from "./api";
import _ from "lodash";
import * as utils from "./utils.js";
import { LoginModal } from "./components/LoginModal";
import { DeleteModal } from "./components/DeleteModal";
import { LoginInfo } from "./components/LoginInfo";
import { Redirect } from 'react-router-dom';
import SubdirectoryArrowRightIcon from '@material-ui/icons/SubdirectoryArrowRight';
import IconButton from '@material-ui/core/IconButton';

class App extends React.Component {
    static propTypes = {
        cookies: instanceOf(Cookies).isRequired
    };

    constructor(props, context) {
        super(props, context);
        this.state = {
            editorAnimating: false,
            editorCode: "",
            editorCursor: {},
            editorFilename: "",
            editorFilenameInput: "",
            editorFiles: [],
            editorReadOnly: true,
            editorSaveMessage: "",
            editorSceneInput: "",
            editorRenderStatus: "",
            editorResolution: "480p",

            treeExpandedKeys: [],

            videoError: consts.DEFAULT_LOGS,
            videoFile: "",
            videoReturncode: -1,
            videoScene: "",
            videoReload: false,
            videoResolution: "480p",
            videoMediaPath: "",

            autosaveTimer: -1,
            renderTimer: -1,
            showFileMoveModal: false,
            showLoginModal: false,
            showProjectDeleteModal: false,
            redirectToHome: false,
        };
    }

    handleTreeExpand = (expandedKeys, cb) => {
        this.setState({ treeExpandedKeys: expandedKeys }, cb);
    };

    handleProjectDelete = () => {
        this.setState({ showProjectDeleteModal: true });
    };

    handleAnimationComplete = () => {
        this.setState({ editorAnimating: false });
    };

    handleSetAutosaveTimeout = () => {
        clearTimeout(this.state.autosaveTimer);
        let autosaveTimer = setTimeout(() => {
            this.handleSave();
        }, consts.AUTOSAVE_TIMEOUT_MS);
        this.setState({
            autosaveTimer: autosaveTimer,
            editorSaveMessage: ""
        });
    };

    loginSuccess = response => {
        this.setState({ showLoginModal: false });
        this.props.onAuth(response);
        this.restoreSession(this.props.access);
    };

    handleFileRename = (e, data, target) => {
        e.stopPropagation();
        let filesCopy = _.cloneDeep(this.state.editorFiles);
        let filePath = data.node.id;
        let pathList = filePath.split("/");
        let renameNode = utils.getNodeFromPathList(filesCopy, pathList);
        renameNode.untitled = true;
        this.setState({
            editorFiles: filesCopy
        });
    };

    handleFileDelete = async (e, data, target) => {
        e.stopPropagation();

        const response = await deleteFile(
            this.props.projectName,
            this.props.projectOwner,
            this.props.projectIsShared,
            this.props.access,
            data,
            this.state.editorFiles,
            this.state.autosaveTimer,
            this.state.editorCursor,
            this.state.treeExpandedKeys
        );

        this.setState({
            editorFiles: response.filesCopy,
            editorFilename: "",
            editorCode: "",
            editorCursor: {},
            treeExpandedKeys: response.expandedKeysCopy
        });
    };

    getHeadersDict = accessToken => {
        return accessToken.length !== 0
            ? { Authorization: "Bearer " + this.props.access }
            : {};
    };

    changeSubtreeIds = (node, oldIdPrefix, newIdPrefix) => {
        if ("id" in node && node.id.startsWith(oldIdPrefix)) {
            node.id = newIdPrefix + node.id.slice(oldIdPrefix.length);
        }
        if ("children" in node) {
            for (let i = 0; i < node.children.length; i++) {
                this.changeSubtreeIds(
                    node.children[i],
                    oldIdPrefix,
                    newIdPrefix
                );
            }
        }
    }

    handleNewFileName = async (node, name) => {
        let filesCopy = _.cloneDeep(this.state.editorFiles);
        let nodeCopy = utils.getNodeFromPathList(
            filesCopy,
            utils.getNodePathList(node)
        );
        let siblingList =
            "directory" in node ? nodeCopy.directory.children : filesCopy;

        let valid = true;
        let errorMsg = "";
        if (
            _.find(siblingList, o => {
                return o.name === name;
            })
        ) {
            valid = false;
            errorMsg = "filename is taken";
        } else if (name.indexOf("/") !== -1) {
            valid = false;
            errorMsg = "invalid filename";
        }
        if (!valid) {
            alert(errorMsg);
            if (node.name === undefined) {
                _.remove(siblingList, o => {
                    return _.isEqual(o, node);
                });
            } else {
                nodeCopy.untitled = false;
            }
            this.setState({ editorFiles: filesCopy });
            return;
        }
        let data;
        let pathList = utils.getNodePathList(node);
        if (pathList[pathList.length - 1] === undefined) {
            pathList[pathList.length - 1] = name;
            data = {
                // TODO: this should maybe be a path list
                // (if you want to REALLY enforce separation)
                name: pathList.join("/"),
                project: this.props.projectName,
                code: ""
            };
        } else {
            let newNamePathList = _.cloneDeep(pathList);
            newNamePathList[newNamePathList.length - 1] = name;
            data = {
                // TODO: this should maybe be a path list
                // (if you want to REALLY enforce separation)
                name: pathList.join("/"),
                project: this.props.projectName,
                // TODO: join the path from pathList
                newName: newNamePathList.join("/")
            };
        }
        if ("children" in node) {
            data["directory"] = true;
        } else {
            data["directory"] = false;
        }
        const response = await newFileName(
            node,
            name,
            data,
            siblingList,
            nodeCopy,
            filesCopy,
            this.props.projectName,
            this.changeSubtreeIds,
            this.state.treeExpandedKeys,
            this.state.editorFilename,
            this.state.editorCursor,
            this.props.access
        );
        console.log(response.response);
        if (
            response.response !== undefined &&
            response.response.status === 401
        ) {
            this.setState({ editorFiles: filesCopy, showLoginModal: true });
        } else if (
            response.response !== undefined &&
            response.response.status === 400
        ) {
            console.log(response.response.data.error);
            // they probably gave an illegal filename
            this.setState({ editorFiles: filesCopy });
        } else {
            this.setState({
                editorFiles: response.filesCopy,
                editorFilename: response.newFilename,
                editorCursor: response.newCursor,
                treeExpandedKeys: response.expandedKeysCopy
            });
        }
    };

    handleToggle = (node, toggled) => {
        if (
            node.untitled ||
            node.active ||
            (!("children" in node) && node.empty)
        ) {
            return;
        }
        // TODO: only if file changed
        clearInterval(this.state.autosaveTimer);
        let filesCopy = _.cloneDeep(this.state.editorFiles);
        let nodeCopy = utils.getNodeFromPathList(
            filesCopy,
            utils.getNodePathList(node)
        );
        let oldCursorCopy = utils.getNodeFromPathList(
            filesCopy,
            utils.getNodePathList(this.state.editorCursor)
        );
        let newCursorCopy = this.state.editorCursor;

        if (!("children" in node)) {
            nodeCopy.active = true;
            if (
                !_.isEmpty(this.state.editorCursor) &&
                this.state.editorCursor !== undefined
            ) {
                oldCursorCopy.active = false;
            }
            newCursorCopy = nodeCopy;
        } else {
            nodeCopy.toggled = toggled;
        }
        if ("children" in node && toggled && node.loading) {
            this.fetchDirectoryContents(nodeCopy);
        } else {
            this.fetchFileContents(nodeCopy);
        }
        this.setState({
            editorFiles: filesCopy,
            editorCursor: newCursorCopy
        });
    };

    handleNewFile = (e, data, target) => {
        // if data is undefined, a top-level file is being created
        let isTopLevel = data === undefined;
        let action;
        if (isTopLevel) {
            action = e;
        } else {
            action = data.action;
        }
        if (action !== "new-file" && action !== "new-directory") {
            console.log("unknown action");
            return;
        }

        let filesCopy = _.cloneDeep(this.state.editorFiles);
        let animating = this.state.editorAnimating;
        let nodeCopy;
        if (action === "new-file") {
            nodeCopy = {
                name: undefined,
                untitled: true
            };
        } else {
            nodeCopy = {
                name: undefined,
                untitled: true,
                empty: true,
                children: consts.NO_CHILDREN
            };
        }
        let siblingList;
        let fileIndex;
        if (isTopLevel) {
            siblingList = filesCopy;
            nodeCopy["id"] = consts.UNNAMED_FILE_ID;
            if ("children" in nodeCopy) {
                nodeCopy.children[0].id =
                    nodeCopy.id + "/" + nodeCopy.children[0].name;
            }
        } else {
            let pathList = data.node.id.split("/");
            let newParent = utils.getNodeFromPathList(filesCopy, pathList);
            siblingList = newParent.children;
            if (!newParent.toggled) {
                newParent.toggled = true;
                animating = true;
            }
            newParent.loading = false;
            nodeCopy.directory = newParent;
            if (newParent.empty) {
                newParent.empty = false;
                siblingList.length = 0;
            }
            nodeCopy["id"] = newParent.id + "/" + consts.UNNAMED_FILE_ID;
            if ("children" in nodeCopy) {
                nodeCopy.children[0].id =
                    nodeCopy.id + "/" + nodeCopy.children[0].name;
            }
        }
        if (action === "new-file") {
            fileIndex = siblingList.length;
        } else {
            fileIndex = _.findIndex(siblingList, o => {
                return !("children" in o);
            });
            if (fileIndex === -1) {
                fileIndex = siblingList.length;
            }
        }
        siblingList.splice(fileIndex, 0, nodeCopy);
        this.setState({
            editorFiles: filesCopy,
            editorAnimating: animating
        });
    };

    restoreSession = async accessToken => {
        const response = await fetchRestoreSession(
            accessToken,
            this.state.editorFilename,
            this.props.projectName,
            this.props.projectOwner,
            this.props.projectIsShared,
            this.logOut,
        );
        if (response.info && response.info === 'no project specified or session to restore') {
            this.setState({redirectToProjects: true});
        } else if (response) {
            this.setState({
                editorCode: response.data.code || this.state.editorCode,
                editorFilename:
                    response.data.filename || this.state.editorFilename,
                editorFilenameInput:
                    response.data.filename || this.state.editorFilenameInput,
                editorFiles: response.files || this.state.editorFiles,
                editorSceneInput: response.data.scene || this.state.videoScene,
                videoScene: response.data.scene || this.state.videoScene
            });
            if ("username" in response.data) {
                this.props.onUsernameReceived(response.data["username"]);
            }
            if ("project_name" in response.data) {
                this.props.onNewProject(
                    response.data["project_name"],
                    response.data["project_owner"],
                    response.data["project_is_shared"],
                );
            }
        }
    };

    componentDidMount() {
        this.restoreSession(this.props.access);
    }

    handleModalClick = event => {
        if ("closeonclick" in event.target.attributes) {
            this.setState({
                showLoginModal: false,
                showFileMoveModal: false,
                showProjectDeleteModal: false
            });
        }
    };

    deleteOwnedProject = async (projectName, projectShared) => {
        console.log('deleting ' + projectName);
        const response = await deleteProject(
            this.props.access,
            projectName,
            projectShared,
        );
        response && this.setState({redirectToProjects: true});
    }

    fetchFileContents = async node => {
        // double clicking a directory has no effect
        if ("children" in node) {
            return;
        }
        const response = await getFileContents(
            node,
            this.props.access,
            this.props.projectName,
            this.props.projectOwner,
            this.props.projectIsShared,
        );
        this.setState({
            editorFilename: utils.getNodePathList(node).join("/"),
            editorCode: response.data["content"],
            displayingLibraryCode: response.displayingLibraryCode
        });
    };

    getNodePathList = node => {
        let currentNode = node;
        let dirs = [currentNode.name];
        while ("directory" in currentNode) {
            currentNode = currentNode.directory;
            dirs.push(currentNode.name);
        }
        return dirs.reverse();
    };

    getPathBaseName = path => {
        let tokens = path.split("/");
        return tokens[tokens.length - 1];
    };

    treeChange = nodes => {
        this.setState({ editorFiles: nodes });
    };

    fetchDirectoryContents = async (node, cb) => {
        const response = await getDirectoryContents(
            node,
            this.props.access,
            this.state.editorFiles,
            this.props.projectName,
            this.props.projectOwner,
            this.props.projectIsShared,
        );
        this.setState({ editorFiles: response }, () => {
            if (cb) {
                cb();
            }
        });
    };

    handleCodeChange = newValue => {
        this.setState({ editorCode: newValue });
    };

    handleSceneChange = event => {
        this.setState({ videoScene: event.target.value });
    };

    handleFilenameChange = event => {
        this.setState({ editorFilename: event.target.value });
    };

    handleInputFilenameChange = event => {
        this.setState({ editorFilenameInput: event.target.value });
    };

    handleInputSceneChange = event => {
        this.setState({ editorSceneInput: event.target.value });
    };

    logOut = () => {
        // TODO: go to homepage
        this.props.onLogOut();
        // this.restoreSession("");
        this.setState({
            videoScene: "",
            videoReturncode: -1,
            videoError: consts.DEFAULT_LOGS,
            editorSaveMessage: "",
            redirectToHome: true,
        });
    };

    handleRenderFinished = responseData => {
        if (responseData.result["returncode"] === 0) {
            // a hack to get the video component to reload
            this.setState({
                editorRenderStatus: "",
                renderTimer: -1,
                videoError: responseData.result["stderr"],
                videoReturncode: 0,
                videoScene: responseData["scene"],
                videoReload: !this.state.videoReload,
                videoMediaPath: responseData["media_path"],
            });
        } else {
            let error;
            if (responseData.result["stderr"].length !== 0) {
                error = responseData.result["stderr"];
            } else if (responseData.result["stdout"] !== 0) {
                error = responseData.result["stdout"];
            } else {
                error = responseData.result["error"];
            }
            this.setState({
                editorRenderStatus: "",
                renderTimer: -1,
                videoError: error,
                videoReturncode: responseData.result["returncode"] || -1,
                videoScene: responseData["scene"] || ""
            });
        }
    };

    handleRenderCanceled = () => {
        // TODO: cancel remote job
        clearInterval(this.state.renderTimer);
        this.setState({
            renderTimer: -1,
            editorRenderStatus: ""
        });
    };

    checkRender = async job_id => {
        const response = await checkRenderStatus(job_id);
        if (
            response.response !== undefined &&
            response.response.status === 401
        ) {
            console.log("not authenticated");
        } else {
            if ("status" in response.data) {
                let renderStatus = response.data["status"];
                if (renderStatus === "unknown job") {
                    renderStatus = this.state.editorRenderStatus;
                }
                if (renderStatus === "finished") {
                    this.handleRenderFinished(response.data);
                } else if (renderStatus === "failed") {
                    this.setState({
                        editorRenderStatus: renderStatus,
                        renderTimer: null,
                    });
                } else {
                    this.setState({
                        editorRenderStatus: renderStatus,
                        renderTimer: setTimeout(() => {
                            this.checkRender(job_id);
                        }, consts.CHECK_RENDER_INTERVAL_MS)
                    });
                }
            }
        }
    };

    handleRender = async () => {
        let requestScene = this.state.editorSceneInput;
        const response = await postRender(
            this.state.editorFilenameInput,
            this.state.editorSceneInput,
            this.state.editorResolution,
            this.props.projectName,
            this.props.projectOwner,
            this.props.projectIsShared,
            this.props.access,
        );
        if (
            response.response !== undefined &&
            response.response.status === 401
        ) {
            this.setState({ showLoginModal: true });
        } else if (
            'info' in response.data &&
            response.data.info === 'cached'
        ) {
            this.setState({
                videoMediaPath: response.data["location"],
                videoReturncode: 0,
                videoReload: !this.state.videoReload,
                videoScene: requestScene,
                videoError: 'Viewing cached video',
            });
        } else {
            this.setState({ editorRenderStatus: "request-sent" });
            this.checkRender(response.data["job_id"]);
        }
    };

    handleSave = async () => {
        if (this.state.displayingLibraryCode) {
            alert("sorry");
        }
        // TODO: implement save-on-signup
        const response = await saveProject(
            this.state.editorFilename,
            this.props.projectName,
            this.state.editorSceneInput,
            this.state.editorCode,
            this.props.access,
        );
        console.log(response);

        if (
            response.response !== undefined &&
            response.response.status === 401
        ) {
            this.setState({ showLoginModal: true });
        } else if (
            response.response !== undefined &&
            response.response.status === 400
        ) {
            console.log(response.response.data.error);
            // they probably gave an illegal filename
        } else {
            this.setState({
                editorFilename: response.data.filename,
                editorSaveMessage: "saved"
            });
            // TODO: factor from here and RenderResponse
            if ("authorization" in response.headers) {
                this.props.onSignUp(response.headers["authorization"]);
            }
        }
    };

    handleResolutionChange = (event) => {
        this.setState({editorResolution: event.target.value});
    }

    render() {
        if (this.state.redirectToProjects) {
            return <Redirect to={{pathname: "/projects"}}/>;
        } else if (this.state.redirectToHome) {
            return <Redirect to={{pathname: "/"}}/>;
        }
        return (
            <div className="page-container">
                <div className="header">
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
                    <span>
                        {this.props.projectName + " by " + this.props.projectOwner + " (" + (this.props.projectIsShared ? "shared" : "private") + ")"}
                    </span>
                    <div className="appbar-buttons">
                        <NavLink to="/projects">
                            <IconButton >
                                <SubdirectoryArrowRightIcon />
                            </IconButton>
                        </NavLink>
                        <LoginInfo
                            username={this.props.username}
                            logOut={this.logOut}
                            from={"/create"}
                        />
                    </div>
                </div>
                <div className="app-container">
                    <NotVideo
                        error={this.state.videoError}
                        filename={this.state.videoFile}
                        project={this.props.projectName}
                        resolution={this.state.videoResolution}
                        returncode={this.state.videoReturncode}
                        scene={this.state.videoScene}
                        username={this.props.username}
                        access={this.props.access}
                        reload={this.state.videoReload}
                        mediaPath={this.state.videoMediaPath}
                    />
                    <Editor
                        animating={this.state.editorAnimating}
                        code={this.state.editorCode}
                        cursor={this.state.editorCursor}
                        filename={this.getPathBaseName(
                            this.state.editorFilename
                        )}
                        filenameInput={this.state.editorFilenameInput}
                        files={this.state.editorFiles}
                        readOnly={
                            this.state.displayingLibraryCode ||
                            this.props.access.length === 0 ||
                            this.props.projectIsShared
                        }
                        renderStatus={this.state.editorRenderStatus}
                        resolution={this.state.editorResolution}
                        saveMessage={this.state.editorSaveMessage}
                        sceneInput={this.state.editorSceneInput}
                        shared={this.props.projectIsShared}
                        expandedKeys={this.state.treeExpandedKeys}
                        onAnimationComplete={this.handleAnimationComplete}
                        onCodeChange={this.handleCodeChange}
                        onFileDelete={this.handleFileDelete}
                        onFileMove={this.handleFileMove}
                        onFileRename={this.handleFileRename}
                        onFilenameChange={this.handleFilenameChange}
                        onInputFilenameChange={this.handleInputFilenameChange}
                        onInputSceneChange={this.handleInputSceneChange}
                        onNewFile={this.handleNewFile}
                        onNewFileName={this.handleNewFileName}
                        onRender={this.handleRender}
                        onRenderCanceled={this.handleRenderCanceled}
                        onResolutionChange={this.handleResolutionChange}
                        onSave={this.handleSave}
                        onSceneChange={this.handleSceneChange}
                        onSetAutosaveTimeout={this.handleSetAutosaveTimeout}
                        onToggle={this.handleToggle}
                        onProjectDelete={this.handleProjectDelete}
                        onTreeChange={this.treeChange}
                        onTreeExpand={this.handleTreeExpand}
                        onFileFetch={this.fetchFileContents}
                        onDirFetch={this.fetchDirectoryContents}
                    />
                </div>
                {this.state.showLoginModal && (
                    <LoginModal
                        handleModalClick={this.handleModalClick}
                        loginSuccess={this.loginSuccess}
                    />
                )}
                {this.state.showProjectDeleteModal && (
                    <DeleteModal
                        handleModalClick={this.handleModalClick}
                        handleProjectDelete={() => {
                            this.deleteOwnedProject(
                                this.props.projectName,
                                this.props.projectIsShared,
                            );
                        }}
                    />
                )}
            </div>
        );
    }
}

export default withRouter(withCookies(App));
