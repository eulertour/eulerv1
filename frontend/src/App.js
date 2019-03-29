import 'antd/dist/antd.css';
import './App.css';
import React from 'react';
import { withRouter, NavLink } from 'react-router-dom';
import { instanceOf } from 'prop-types';
import { withCookies, Cookies } from 'react-cookie';
import axios from 'axios';
import NotVideo from './components/notvideo.jsx';
import * as consts from './constants.js';
import Editor from './components/editor.jsx';
import logo from './assets/etourlogo.jpg';
import anonymousUser from './assets/icon-name-active@3x.svg';
import fileImage from './assets/icon-file@3x.svg';
import _ from 'lodash';
import Login from './components/login.jsx';
import closeIcon from './assets/e-remove.svg';
import * as utils from './utils.js';
import 'material-icons/css/material-icons.css';
import 'material-icons/iconfont/material-icons.css';

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

            videoError: consts.DEFAULT_LOGS,
            videoFile: "",
            videoReturncode: -1,
            videoScene: "",
            videoReload: false,

            autosaveTimer: -1,
            project: "",
            renderTimer: -1,
            showFileMoveModal: false,
            showLoginModal: false,
            showProjectResetModal: false,
        }
        this.fetchDirectoryContents = this.fetchDirectoryContents.bind(this);
        this.fetchFileContents = this.fetchFileContents.bind(this);
        this.handleAnimationComplete=this.handleAnimationComplete.bind(this);
        this.handleCodeChange = this.handleCodeChange.bind(this);
        this.handleFileDelete=this.handleFileDelete.bind(this);
        this.handleFileRename=this.handleFileRename.bind(this);
        this.handleFilenameChange = this.handleFilenameChange.bind(this);
        this.handleInputFilenameChange = this.handleInputFilenameChange.bind(this);
        this.handleInputSceneChange = this.handleInputSceneChange.bind(this);
        this.handleModalClick = this.handleModalClick.bind(this);
        this.handleNewFile = this.handleNewFile.bind(this);
        this.handleNewFileName = this.handleNewFileName.bind(this);
        this.handleRender = this.handleRender.bind(this);
        this.handleRenderCanceled = this.handleRenderCanceled.bind(this);
        this.handleRenderFinished = this.handleRenderFinished.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleSceneChange = this.handleSceneChange.bind(this);
        this.handleSetAutosaveTimeout=this.handleSetAutosaveTimeout.bind(this);
        this.handleProjectReset=this.handleProjectReset.bind(this);
        this.handleToggle = this.handleToggle.bind(this);
        this.logOut = this.logOut.bind(this);
        this.restoreSession = this.restoreSession.bind(this);
        this.resetProject = this.resetProject.bind(this);

        this.treeChange = this.treeChange.bind(this);
    }

    handleProjectReset() {
        this.setState({showProjectResetModal: true});
    }

    resetProject() {
        axios.delete(consts.PROJECT_DELETE_URL, {
            params: {project: this.state.project},
            headers: this.getHeadersDict(this.props.access),
        })
        .then(response => {
            let files = response.data.files.map(obj => {
                if (obj.directory) {
                    delete obj.directory;
                    let childrenNotLoaded = consts.CHILDREN_NOT_LOADED;
                    childrenNotLoaded[0]['id'] = childrenNotLoaded[0]['name'];
                    obj['children'] = childrenNotLoaded;
                    obj['loading'] = true;
                } else {
                    delete obj.directory;
                }
                if (obj['library']) {
                    obj['readOnly'] = true;
                }
        obj['id'] = obj['name'];
                return obj;
            });
            this.setState({
                editorCode: response.data.code,
                editorFilename: response.data.filename,
                editorFilenameInput: response.data.filename,
                editorFiles: files,
                editorSceneInput: response.data.scene,
                project: response.data.project,
                videoScene: response.data.scene,
            });
        })
        .catch(error => {
            if (error.response !== undefined &&
                error.response.statusText === 'Unauthorized') {
                this.setState({showLoginModal: true});
            }
        });
    }

    handleAnimationComplete() {
        this.setState({editorAnimating: false});
    }

    handleSetAutosaveTimeout() {
        clearTimeout(this.state.autosaveTimer);
        let autosaveTimer = setTimeout(
            () => { this.handleSave(); },
            consts.AUTOSAVE_TIMEOUT_MS
        );
        this.setState({
            autosaveTimer: autosaveTimer,
            editorSaveMessage: "",
        });
    }

    handleFileRename(e, data, target) {
        e.stopPropagation();
        let filesCopy = _.cloneDeep(this.state.editorFiles);
        let filePath = target.children[0].id;
        let pathList = filePath.split('/');
        let renameNode = utils.getNodeFromPathList(
            filesCopy,
            pathList,
        );
        renameNode.untitled = true;
        this.setState({
            editorFiles: filesCopy,
        });
    }

    handleFileDelete(e, data, target) {
        e.stopPropagation();
        let filePath = target.children[0].id;
        let pathList = filePath.split('/');
        let delNode = utils.getNodeFromPathList(
            this.state.editorFiles,
            pathList,
        );
        axios.delete(consts.MODULE_DELETE_URL, {
            params: {
                project: this.state.project,
                name: filePath,
                directory: 'children' in delNode ? 1 : 0,
            },
            headers: this.getHeadersDict(this.props.access),
        })
        .then(response => {
            let filesCopy = _.cloneDeep(this.state.editorFiles);
            let delNode = utils.getNodeFromPathList(filesCopy, pathList);
            if ('directory' in delNode) {
                _.remove(
                    delNode.directory.children,
                    (o) => {return _.isEqual(o, delNode)}
                );
                if (delNode.directory.children.length === 0) {
                    delNode.directory.children = consts.NO_CHILDREN;
                    delNode.directory.empty = true;
                }
            } else {
                _.remove(filesCopy, (o) => {return _.isEqual(o, delNode)});
            }
            clearTimeout(this.state.autosaveTimer);
            if (!_.isEmpty(this.state.editorCursor) && !delNode.active) {
                utils.getNodeFromPathList(
                    filesCopy,
                    utils.getNodePathList(this.state.editorCursor),
                ).active = false;
            }
            this.setState({
                editorFiles: filesCopy,
                editorFilename: "",
                editorCode: "",
                editorCursor: {},
            });
        })
        .catch(error => {
            if (error.response !== undefined) {
                console.log(error.response);
                console.log(error.response.data);
            }
        });
    }

    getHeadersDict(accessToken) {
        return accessToken.length !== 0 ?
            {'Authorization': 'Bearer ' + this.props.access} :
            {};
    }

    handleNewFileName(node, name) {
        let filesCopy = _.cloneDeep(this.state.editorFiles);
        let nodeCopy = utils.getNodeFromPathList(
            filesCopy,
            utils.getNodePathList(node),
        );
        let siblingList = 'directory' in node ?
            nodeCopy.directory.children :
            filesCopy;

        let valid = true;
        let errorMsg = "";
        if (_.find(siblingList, (o) => {return o.name === name})) {
            valid = false;
            errorMsg = "filename is taken";
        } else if (name.indexOf('/') !== -1) {
            valid = false;
            errorMsg = "invalid filename";
        }
        if (!valid) {
            alert(errorMsg);
            _.remove(siblingList, (o) => {return _.isEqual(o, node)});
            this.setState({editorFiles: filesCopy});
            return;
        }
        let data;
        let pathList = utils.getNodePathList(node);
        if (pathList[pathList.length - 1] === undefined) {
            pathList[pathList.length - 1] = name;
            data = {
                // TODO: this should maybe be a path list
                // (if you want to REALLY enforce separation)
                name: pathList.join('/'),
                project: this.state.project,
                code: "",
            };
        } else {
            let newNamePathList = _.cloneDeep(pathList);
            newNamePathList[newNamePathList.length - 1] = name;
            data = {
                // TODO: this should maybe be a path list
                // (if you want to REALLY enforce separation)
                name: pathList.join('/'),
                project: this.state.project,
                // TODO: join the path from pathList
                newName: newNamePathList.join('/'),
            };
        }
        if ("children" in node) {
            data['directory'] = true;
        } else {
            data['directory'] = false;
        }
        axios.post(
            consts.SAVE_URL,
            data,
            {headers: this.getHeadersDict(this.props.access)},
        )
        .then(response => {
            nodeCopy['untitled'] = false;
            nodeCopy['name'] = name;
            nodeCopy['project'] = this.state.project;
            if ('parent' in nodeCopy) {
                nodeCopy['id'] = nodeCopy['parent'].id + '/' + name;
            } else {
                nodeCopy['id'] = name;
            }

            // TODO: actually check the number of lib dirs
            let libraryDirs;
            if (!('directory' in node)) {
                libraryDirs = filesCopy.slice(0, 1);
                siblingList = filesCopy.slice(1);
            } else {
                libraryDirs = [];
                siblingList = nodeCopy.directory.children;
            }
            let fileIndex = siblingList.findIndex(
                (o) => {return !("children" in o)}
            );
            if (fileIndex === -1) {
                fileIndex = filesCopy.length;
            }
            let dirArray = siblingList.slice(0, fileIndex);
            let fileArray = siblingList.slice(fileIndex);
            let nodeSort = (o1, o2) => {
                if (o1.name < o2.name)
                    return -1;
                else if (o1.name > o2.name)
                    return 1;
                else
                    return 0;
            };
            if ('children' in node) {
                nodeCopy['empty'] = true;
                dirArray = dirArray.sort(nodeSort);
            } else {
                fileArray = fileArray.sort(nodeSort);
            }
            fileArray = dirArray.concat(fileArray);
            if (!('directory' in node)) {
                // TODO: actually check the number of lib dirs
                filesCopy = libraryDirs.concat(fileArray);
            } else {
                nodeCopy.directory.children = libraryDirs.concat(fileArray);
            }
            let newFilename = this.state.editorFilename;
            let newCursor = this.state.editorCursor;
            if (!_.isEmpty(this.state.editorCursor)) {
                let cursorMaybe = utils.getNodeFromPathList(
                    filesCopy,
                    utils.getNodePathList(this.state.editorCursor));
                if (this.state.editorCursor.name !== cursorMaybe.name) {
                    newFilename = utils.getNodePathList(nodeCopy).join('/');
                    newCursor = nodeCopy;
                }
            }
            this.setState({
                editorFiles: filesCopy,
                editorFilename: newFilename,
                editorCursor: newCursor,
            });
        })
        .catch(error => {
            if (siblingList.length === 1) {
                nodeCopy.directory.empty = true;
                nodeCopy.directory.children = consts.NO_CHILDREN;
            } else {
                _.remove(siblingList, (o) => {return _.isEqual(o, node)});
            }
            this.setState({editorFiles: filesCopy});
            if (error.response !== undefined &&
                error.response.statusText === 'Unauthorized') {
                this.setState({showLoginModal: true});
            }
            if (error.response !== undefined &&
                error.response.status === 400) {
                console.log(error.response.data.error);
                // they probably gave an illegal filename
                this.setState({});
            }
        });
    }

    handleToggle(node, toggled) {
        if (
            node.untitled ||
            node.active ||
            (!('children' in node) && node.empty)
        ) {
            return;
        }
        // TODO: only if file changed
        clearInterval(this.state.autosaveTimer);
        let filesCopy = _.cloneDeep(this.state.editorFiles);
        let nodeCopy = utils.getNodeFromPathList(
            filesCopy, utils.getNodePathList(node));
        let oldCursorCopy = utils.getNodeFromPathList(
            filesCopy, utils.getNodePathList(this.state.editorCursor));
        let newCursorCopy = this.state.editorCursor;

        if (!("children" in node)) {
            nodeCopy.active = true;
            if (!_.isEmpty(this.state.editorCursor) && this.state.editorCursor !== undefined) {
                oldCursorCopy.active = false;
            }
            newCursorCopy = nodeCopy;
        } else {
            nodeCopy.toggled = toggled;
        }
        if ('children' in node && toggled && node.loading) {
            this.fetchDirectoryContents(nodeCopy);
        } else {
            this.fetchFileContents(nodeCopy);
        }
        this.setState({
            editorFiles: filesCopy,
            editorCursor: newCursorCopy,
        });
    }

    handleNewFile(e, data, target) {
        // if data is undefined, a top-level file is being created
        let action;
        if (data === undefined) {
            action = e;
        } else {
            action = data.action;
        }
        if (!_.find(['new-file', 'new-directory'],
            (o) => {return o === action})) {
            console.log('unknown action');
            return;
        }

        let filesCopy = _.cloneDeep(this.state.editorFiles);
        let animating = this.state.editorAnimating;
        let nodeCopy;
        if (action === 'new-file') {
            nodeCopy = {
                name: undefined,
                untitled: true,
            };
        } else {
            nodeCopy = {
                name: undefined,
                untitled: true,
                empty: true,
                children: consts.NO_CHILDREN,
            };
        }
        let siblingList;
        let fileIndex;
        if (data === undefined) {
            siblingList = filesCopy;
            nodeCopy['id'] = consts.UNNAMED_FILE_ID;
            if ('children' in nodeCopy) {
                nodeCopy.children[0].id = nodeCopy.id + '/' + nodeCopy.children[0].name;
            }
        } else {
            let pathList = target.children[0].id.split('/');
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
            nodeCopy['id'] = newParent.id + '/' + consts.UNNAMED_FILE_ID;
            if ('children' in nodeCopy) {
                nodeCopy.children[0].id = nodeCopy.id + '/' + nodeCopy.children[0].name;
            }
        }
        if (action === 'new-file') {
            fileIndex = siblingList.length;
        } else {
            fileIndex = _.findIndex(
                siblingList,
                (o) => {return !("children" in o)}
            );
            if (fileIndex === -1) {
                fileIndex = siblingList.length;
            }
        }
        siblingList.splice(fileIndex, 0, nodeCopy);
        this.setState({
            editorFiles: filesCopy,
            editorAnimating: animating,
        });
    }

    restoreSession(accessToken) {
        axios.post(
            consts.SESSION_URL,
            {
                // TODO: this should be a path list
                name: this.state.editorFilename,
                project: this.state.project,
                directory: true,
            },
            {headers: this.getHeadersDict(accessToken)},
        )
        .then(response => {
            let files = response.data.files.map(obj => {
                if (obj.directory) {
                    delete obj.directory;
                    let childrenNotLoaded = consts.CHILDREN_NOT_LOADED;
                    childrenNotLoaded[0]['id'] = childrenNotLoaded[0]['name'];
                    obj['children'] = childrenNotLoaded;
                    obj['loading'] = true;
                } else {
                    delete obj.directory;
                }
                if (obj['library']) {
                    obj['readOnly'] = true;
                }
                obj['id'] = obj['name'];
                return obj;
            });
            this.setState({
                editorCode: response.data.code || this.state.editorCode,
                editorFilename: response.data.filename || this.state.editorFilename,
                editorFilenameInput: response.data.filename || this.state.editorFilenameInput,
                editorFiles: files || this.state.editorFiles,
                editorSceneInput: response.data.scene || this.state.videoScene,
                project: response.data.project || this.state.project,
                videoScene: response.data.scene || this.state.videoScene,
            });
            if ('username' in response.data) {
                this.props.onSessionRestore(response.data['username'])
            }
        })
        .catch(error => {
            if ('response' in error && error.response !== undefined
                && 'data' in error.response) {
                let data = error.response.data;
                console.log(data);
                if (error.response.status === 401 &&
                    data.code === 'token_not_valid' &&
                    data.detail === 'Given token not valid for any token type') {
                    alert('there was an error processing your token, ' +
                          'please log in again');
                    this.logOut();
                }
            }
            console.log(error.response);
        });
    }

    componentDidMount() {
        this.restoreSession(this.props.access);
    }

    handleModalClick(event) {
        if ('closeonclick' in event.target.attributes) {
            this.setState({
                showLoginModal: false,
                showFileMoveModal: false,
                showProjectResetModal: false,
            });
        }
    }

    fetchFileContents(node) {
        // double clicking a directory has no effect
        if ('children' in node) {
            return;
        }
        axios.post(
            consts.GET_FILES_URL,
            {
                project: node.project,
                pathList: utils.getNodePathList(node),
            },
            {headers: this.getHeadersDict(this.props.access)},
        )
        .then(response => {
            let displayingLibraryCode;
            if (node.directory !== undefined && node.directory['library']) {
                displayingLibraryCode = true;
            }
            this.setState({
                editorFilename: utils.getNodePathList(node).join('/'),
                editorCode: response.data['content'],
                displayingLibraryCode: displayingLibraryCode,
            })
        })
        .catch(error => {
            console.log(error);
            console.log(error.data);
        });
    }

    getNodePathList(node) {
        let currentNode = node;
        let dirs = [currentNode.name];
        while ('directory' in currentNode) {
            currentNode = currentNode.directory;
            dirs.push(currentNode.name);
        }
        return dirs.reverse();
    }

    getPathBaseName(path) {
        let tokens = path.split('/');
        return tokens[tokens.length - 1];
    }

    treeChange(nodes) {
        this.setState({editorFiles: nodes});
    }

    fetchDirectoryContents(node, cb) {
        let pathList = utils.getNodePathList(node);
        
        axios.post(
            consts.GET_FILES_URL,
            {
                project: node.project,
                pathList: pathList,
            },
            {headers: this.getHeadersDict(this.props.access)},
        )
        .then(response => {
            let filesCopy = _.cloneDeep(this.state.editorFiles);
            let nodeCopy = utils.getNodeFromPathList(filesCopy, pathList);
            if (response.data.length !== 0) {
                let files = response.data.map(obj => {
                    if (obj.directory) {
                    let childrenNotLoaded = consts.CHILDREN_NOT_LOADED;
                    childrenNotLoaded[0]['id'] = childrenNotLoaded[0]['name'];
                        obj['children'] = childrenNotLoaded;
                        obj['loading'] = true;
                        obj['directory'] = node;
                    } else {
                        obj['directory'] = node;
                    }
                    if (node['library']) {
                        obj['library'] = true;
                        obj['readOnly'] = true;
                    }
                    obj['id'] = nodeCopy['id'] + '/' + obj['name'];
                    return obj;
                });
                nodeCopy['children'] = files;
            } else {
                nodeCopy['empty'] = true;
                let noChildren = consts.NO_CHILDREN;
                noChildren[0]['id'] = nodeCopy['id'] + '/' + noChildren['name'];
                nodeCopy['children'] = noChildren;
            }
            nodeCopy['loading'] = false;
            this.setState({editorFiles: filesCopy}, () => {
                if (cb) {
                    cb();
                }
            });
        })
        .catch(error => {
            console.log(error);
            console.log(error.data);
        })
    }

    handleCodeChange(newValue) {
        this.setState({editorCode: newValue});
    }

    handleSceneChange(event) {
        this.setState({videoScene: event.target.value});
    }

    handleFilenameChange(event) {
        this.setState({editorFilename: event.target.value});
    }

    handleInputFilenameChange(event) {
        this.setState({editorFilenameInput: event.target.value});
    }

    handleInputSceneChange(event) {
        this.setState({editorSceneInput: event.target.value});
    }

    logOut() {
        // TODO: go to homepage
        this.props.onLogOut();
        this.restoreSession('');
        this.setState({
            videoScene: consts.DEFAULT_SELECTED_SCENE,
            videoReturncode: -1,
            videoError: consts.DEFAULT_LOGS,
            editorSaveMessage: "",
        });
    }

    handleRenderFinished(responseData) {
        if (responseData.result['returncode'] === 0) {
            // a hack to get the video component to reload
            this.setState({
                editorRenderStatus: "",
                renderTimer: -1,
                videoError: responseData.result['stderr'],
                videoReturncode: 0,
                videoScene: responseData['scene'],
                videoFile: responseData['filename'],
                videoReload: !this.state.videoReload,
            });
        } else {
            let error;
            if (responseData.result['stderr'].length !== 0) {
                error = responseData.result['stderr'];
            } else if (responseData.result['stdout'] !== 0) {
                error = responseData.result['stdout'];
            } else {
                error = responseData.result['error'];
            }
            this.setState({
                editorRenderStatus: "",
                renderTimer: -1,
                videoError: error,
                videoReturncode: responseData.result['returncode'] || -1,
                videoScene: responseData['scene'] || '',
            });
        }
    }

    handleRenderCanceled() {
        // TODO: cancel remote job
        clearInterval(this.state.renderTimer);
        this.setState({
            renderTimer: -1,
            editorRenderStatus: "",
        });
    }

    checkRender(job_id) {
        axios.get(consts.RENDER_URL + job_id)
        .then(response => {
            if ('status' in response.data) {
                let renderStatus = response.data['status'];
                if (renderStatus === 'unknown job') {
                    renderStatus = this.state.editorRenderStatus;
                }
                if (renderStatus === 'finished') {
                    this.handleRenderFinished(response.data);
                } else {
                    this.setState({
                        editorRenderStatus: renderStatus,
                        renderTimer: setTimeout(
                            () => {this.checkRender(job_id)},
                            consts.CHECK_RENDER_INTERVAL_MS,
                        )
                    });
                }
            }
        })
        .catch(error => {
            if (error.response !==  undefined &&
                error.response.statusText === 'Unauthorized') {
                console.log('not authenticated');
            }
        });
    }

    handleRender() {
        axios({
            method: 'post',
            url: consts.RENDER_URL,
            headers: this.getHeadersDict(this.props.access),
            data: {
                filename: this.state.editorFilenameInput,
                scene: this.state.editorSceneInput,
                project: this.state.project,
            }
        })
        .then(response => {
            if ('job_id' in response.data) {
                this.setState({editorRenderStatus: "request-sent"})
                this.checkRender(response.data['job_id']);
            }
        })
        .catch(error => {
            if (error.response !==  undefined &&
                error.response.statusText === 'Unauthorized') {
                this.setState({showLoginModal: true});
            }
        });
    }

    handleSave() {
        if (this.state.displayingLibraryCode) {
            alert('sorry');
        }
        // TODO: implement save-on-signup
        axios.post(
            consts.SAVE_URL,
            {
                // TODO: this should be a path list
                name: this.state.editorFilename,
                project: this.state.project,
                scene: this.state.editorSceneInput,
                code: this.state.editorCode,
                directory: false,
            },
            {headers: this.getHeadersDict(this.props.access)},
        )
        .then(response => {
            this.setState({
                editorFilename: response.data.filename,
                editorSaveMessage: "saved",
            })
            // TODO: factor from here and RenderResponse
            if ('authorization' in response.headers) {
                this.props.onSignUp(response.headers['authorization']);
            }
        })
        .catch(error => {
            if (error.response !== undefined &&
                error.response.statusText === 'Unauthorized') {
                this.setState({showLoginModal: true});
            }
            if (error.response !== undefined &&
                error.response.status === 400) {
                console.log(error.response.data.error);
                // they probably gave an illegal filename
                this.setState({});
            }
        });
    }

    render() {
        let login_info = '';
        if (this.props.username.length !== 0) {
            login_info = (
                <div className='account-info'>
                    <div className="banner-button emphatic-button files-button">
                        <img
                            className="file-image"
                            src={fileImage}
                            alt="file"
                        />
                        Your Files
                    </div>
                    <div
                        className="banner-button logout-button"
                        onClick={this.logOut}>Log Out</div>
                    <div className="user-image-background">
                        <img
                            className="user-image"
                            src={anonymousUser}
                            alt='user'
                        />
                    </div>
                </div>
            );
        } else {
            login_info = (
                <div className="account-info">
                    <div className="banner-button login-button">
                        <NavLink
                            to={{
                                pathname: "/login",
                                state: {from: "/"}
                            }}
                            className="login">Log In</NavLink>
                    </div>
                    <div className="banner-button emphatic-button">
                        <NavLink
                            to={{
                                pathname: "/signup",
                                state: {from: "/"}
                            }}
                            id="signup-button">Sign Up</NavLink>
                    </div>
                </div>
            )
        }
        let loginModal = this.state.showLoginModal ?
            <div
                className="modal-background"
                closeonclick="true"
                onClick={this.handleModalClick}
            >
                <img
                    className="close-icon"
                    src={closeIcon}
                    alt="close"
                    closeonclick="true"
                />
                <Login
                    controlUrl={false}
                    onAuth={(response) => {
                        this.setState({showLoginModal: false});
                        this.props.onAuth(response);
                        this.restoreSession(this.props.access);
                    }}
                />
            </div> : null;
        let resetModal = this.state.showProjectResetModal ?
            <div
                className="modal-background"
                closeonclick="true"
                onClick={this.handleModalClick}
            >
                <img
                    className="close-icon"
                    src={closeIcon}
                    alt="close"
                    closeonclick="true"
                />
                <div className="reset-modal">
                    <div className="reset-confirmation-container">
                        <div className="reset-confirmation">
                            Are you sure you want to reset
                            to the original project?
                        </div>
                    </div>
                    <div className="reset-buttons">
                        <div
                            className="banner-button danger-button"
                            onClick={() => {
                                this.setState({showProjectResetModal: false});
                                this.resetProject();
                            }}
                        >
                            Reset Project
                        </div>
                        <div
                            className="banner-button emphatic-button"
                            onClick={() => {
                                this.setState({showProjectResetModal: false});
                            }}
                        >
                            Go Back
                        </div>
                    </div>
                </div>
            </div> : null;
        return (
            <div className="page-container">
                <div className="header">
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
                    {this.props.username}
                    {login_info}
                </div>
                <div className="app-container">
                    <NotVideo
                        error={this.state.videoError}
                        filename={this.state.videoFile}
                        project={this.state.project}
                        returncode={this.state.videoReturncode}
                        scene={this.state.videoScene}
                        username={this.props.username}
                        access={this.props.access}
                        reload={this.state.videoReload}
                    />
                    <Editor
                        animating={this.state.editorAnimating}
                        code={this.state.editorCode}
                        cursor={this.state.editorCursor}
                        filename={this.getPathBaseName(this.state.editorFilename)}
                        filenameInput={this.state.editorFilenameInput}
                        files={this.state.editorFiles}
                        readOnly={this.state.displayingLibraryCode || this.props.access.length === 0}
                        renderStatus={this.state.editorRenderStatus}
                        saveMessage={this.state.editorSaveMessage}
                        sceneInput={this.state.editorSceneInput}

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
                        onSave={this.handleSave}
                        onSceneChange={this.handleSceneChange}
                        onSetAutosaveTimeout={this.handleSetAutosaveTimeout}
                        onToggle={this.handleToggle}
                        onProjectReset={this.handleProjectReset}

                        onTreeChange={this.treeChange}
                        onFileFetch={this.fetchFileContents}
                        onDirFetch={this.fetchDirectoryContents}
                    />
                </div>
                {loginModal}
                {resetModal}
            </div>
        );
    }
};

export default withRouter(withCookies(App));
