import React from 'react';
import { withRouter, NavLink } from 'react-router-dom';
import { instanceOf } from 'prop-types';
import { withCookies, Cookies } from 'react-cookie';
import axios from 'axios';
import NotVideo from './components/notvideo.jsx';
import * as consts from './constants.js';
import Editor from './components/editor.jsx';
import './App.css';
import logo from './assets/etourlogo.jpg';
import anonymousUser from './assets/icon-name-active@3x.svg';
import fileImage from './assets/icon-file@3x.svg';
import _ from 'lodash';
import Login from './components/login.jsx';
import closeIcon from './assets/e-remove.svg';
import * as utils from './utils.js';

class App extends React.Component {
    static propTypes = {
        cookies: instanceOf(Cookies).isRequired
    };

    constructor(props, context) {
        super(props, context);
        this.state = {
            error: consts.DEFAULT_LOGS,
            returncode: -1,
            files: [],
            filename: "",
            code: "",
            scene: "",
            selectedScene: "",
            selectedFile: "",
            inputFilename: "",
            cursor: {},
            project: "",
            showLoginModal: false,
            renderTimer: -1,
            saveMessage: "",
            autosaveTimer: -1,
            movingFile: false,
            animating: false,
        }
        this.logOut = this.logOut.bind(this);
        this.restoreSession = this.restoreSession.bind(this);
        this.handleRenderFinished = this.handleRenderFinished.bind(this);
        this.handleRender = this.handleRender.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleCodeChange = this.handleCodeChange.bind(this);
        this.handleSceneChange = this.handleSceneChange.bind(this);
        this.handleFilenameChange = this.handleFilenameChange.bind(this);
        this.handleInputFilenameChange = this.handleInputFilenameChange.bind(this);
        this.fetchDirectoryContents = this.fetchDirectoryContents.bind(this);
        this.fetchFileContents = this.fetchFileContents.bind(this);
        this.handleModalClick = this.handleModalClick.bind(this);
        this.handleNewFile = this.handleNewFile.bind(this);
        this.handleNewFileName = this.handleNewFileName.bind(this);
        this.handleToggle = this.handleToggle.bind(this);
        this.handleFileRename=this.handleFileRename.bind(this);
        this.handleFileMove=this.handleFileMove.bind(this);
        this.handleFileDelete=this.handleFileDelete.bind(this);
        this.handleSetAutosaveTimeout=this.handleSetAutosaveTimeout.bind(this);
        this.handleAnimationComplete=this.handleAnimationComplete.bind(this);
        this.listDirs=this.listDirs.bind(this);
    }

    handleAnimationComplete() {
        this.setState({animating: false});
    }

    ensureDirectoryTree(node) {
        if (node.loading) {
            this.fetchDirectoryTree(node);
        } else if ('children' in node) {
            node.children.forEach((child) => {
                this.ensureDirectoryTree(child);
            });
        }
    }

    fetchDirectoryTree(node) {
        let headers = {};
        if (this.props.access.length !== 0) {
            headers = {'Authorization': 'Bearer ' + this.props.access};
        }
        axios.post(
            consts.TREE_URL,
            {
                // TODO: this should be a path list
                path: utils.getNodePathList(node).join('/'),
                project: node.project,
            },
            {headers: headers},
        )
        .then(response => {
            console.log(response.data);
        })
        .catch(error => {
        
        });
    }

    listDirs(nodeList) {
        if (nodeList === undefined) {
            return null;
        }
        return (
            nodeList.map((node) => {
                if (node.library || !('children' in node)) {
                    return null;
                }
                let children;
                if (!node.empty) {
                    children = this.listDirs(node.children);
                }
                return (
                    <li key={node.name}>
                        <p>{node.name}</p>
                        {children}
                    </li>
                );
            })
        );
    }

    handleSetAutosaveTimeout() {
        clearTimeout(this.state.autosaveTimer);
        let autosaveTimer = setTimeout(
            () => { this.handleSave(); },
            consts.AUTOSAVE_TIMEOUT_MS
        );
        this.setState({
            autosaveTimer: autosaveTimer,
            saveMessage: "",
        });
    }

    handleFileRename(e, data, target) {
        e.stopPropagation();
        console.log(data.action + ' ' + target.children[0].id);
    }

    handleFileMove(e, data, target) {
        e.stopPropagation();
        console.log(data.action + ' ' + target.children[0].id);
        this.setState({movingFile: true});
    }

    handleFileDelete(e, data, target) {
        e.stopPropagation();
        console.log(data.action + ' ' + target.children[0].id);

        let filePath = target.children[0].id;
        let delNode = this.getNodeFromPathList(
            this.state.files,
            filePath.split('/'),
        );
        let headers;
        if (this.props.access.length !== 0) {
            headers = {'Authorization': 'Bearer ' + this.props.access};
        } else {
            headers = {};
        }
        axios.delete(consts.MODULE_DELETE_URL, {
            params: {
                project: this.state.project,
                name: filePath,
                directory: 'children' in delNode ? 1 : 0,
            },
            headers: headers,
        })
        .then(response => {
            let newFiles = _.cloneDeep(this.state.files);
            let delNode = this.getNodeFromPathList(
                newFiles,
                filePath.split('/'),
            );
            if ('directory' in delNode) {
                _.remove(delNode.directory.children,
                    (o) => {return _.isEqual(o, delNode)});
                if (delNode.directory.children.length === 0) {
                    delNode.directory.children = [{
                        name: '(empty)',
                        empty: true,
                        readOnly: true,
                    }];
                    delNode.directory.empty = true;
                }
            } else {
                _.remove(newFiles, (o) => {return _.isEqual(o, delNode)});
            }
            clearTimeout(this.state.autosaveTimer);
            this.setState({
                files: newFiles,
                filename: "",
                code: "",
            });
        })
        .catch(error => {
            if (error.response !== undefined) {
                console.log(error.response);
            }
        });
    }

    handleNewFileName(node, name) {
        // TODO: will fail for non top-level dirs
        let newFiles = _.cloneDeep(this.state.files);
        let newNode = this.getNodeFromPathList(
            newFiles,
            utils.getNodePathList(node)
        );

        // check if the name is taken
        let sibling_list;
        if ('directory' in node) {
            sibling_list = newNode.directory.children;
        } else {
            sibling_list = newFiles;
        }
        let valid = true;
        let errorMsg = "";
        if (_.find(sibling_list,
            (o) => {return o.name === name})) {
            valid = false;
            errorMsg = "filename is taken";
        }
        if (name.indexOf('/') !== -1) {
            valid = false;
            errorMsg = "invalid filename";
        }
        if (!valid) {
            alert(errorMsg);
            _.remove(sibling_list, (o) => {return _.isEqual(o, node)});
            this.setState({
                files: newFiles,
            });
            return;
        }

        let headers;
        if (this.props.access.length !== 0) {
            headers = {'Authorization': 'Bearer ' + this.props.access};
        } else {
            headers = {};
        }
        let pathList = utils.getNodePathList(node);
        pathList[pathList.length - 1] = name;
        axios.post(
            consts.SAVE_URL,
            {
                // TODO: this should be a path list
                name: pathList.join('/'),
                project: this.state.project,
                directory: "children" in node,
            },
            {headers: headers},
        )
        .then(response => {
            newNode['untitled'] = false;
            newNode['name'] = name;
            newNode['project'] = this.state.project;

            if ('children' in node) {
                newNode['empty'] = true;
                // sort the directories
                let libraryDirs;
                let siblingDirs;
                if (!('directory' in node)) {
                    // TODO: actually check the number of lib dirs
                    libraryDirs = newFiles.slice(0, 1);
                    siblingDirs = newFiles.slice(1);
                } else {
                    libraryDirs = [];
                    siblingDirs = newNode.directory.children;
                }
                let fileIndex = siblingDirs.findIndex(
                    (o) => {return !("children" in o)}
                );
                if (fileIndex === -1) {
                    fileIndex = newFiles.length;
                }
                let subarray = siblingDirs.slice(0, fileIndex);
                subarray = subarray.sort((o1, o2) => {
                    if (o1.name < o2.name)
                        return -1;
                    else if (o1.name > o2.name)
                        return 1;
                    else
                        return 0;
                });
                let rest = siblingDirs.slice(fileIndex);
                subarray = subarray.concat(rest);
                if (!('directory' in node)) {
                    // TODO: actually check the number of lib dirs
                    newFiles = libraryDirs.concat(subarray);
                } else {
                    newNode.directory.children = libraryDirs.concat(subarray);
                }
                this.setState({
                    files: newFiles,
                });
            } else {
                // sort the files
                // TODO: actually check the number of lib dirs
                let libraryDirs;
                let siblingDirs;
                if (!('directory' in node)) {
                    // TODO: actually check the number of lib dirs
                    libraryDirs = newFiles.slice(0, 1);
                    siblingDirs = newFiles.slice(1);
                } else {
                    libraryDirs = [];
                    siblingDirs = newNode.directory.children;
                }
                // TODO: handle non top-level dirs
                let fileIndex = siblingDirs.findIndex(
                    (o) => {return !("children" in o)}
                );
                let subarray = siblingDirs.slice(fileIndex);
                subarray = subarray.sort((o1, o2) => {
                    if (o1.name < o2.name)
                        return -1;
                    else if (o1.name > o2.name)
                        return 1;
                    else
                        return 0;
                });
                let rest = siblingDirs.slice(0, fileIndex);
                subarray = rest.concat(subarray);
                if (!('directory' in node)) {
                    // TODO: actually check the number of lib dirs
                    newFiles = libraryDirs.concat(subarray);
                } else {
                    newNode.directory.children = libraryDirs.concat(subarray);
                }
                this.setState({
                    files: newFiles,
                });
            }
        })
        .catch(error => {
            if (sibling_list.length === 1) {
                newNode.directory.empty = true;
                newNode.directory.children = [{
                    name: '(empty)',
                    empty: true,
                    readOnly: true,
                }];
            } else {
                _.remove(sibling_list, (o) => {return _.isEqual(o, node)});
            }
            this.setState({
                files: newFiles,
            });
            if (error.response !== undefined &&
                error.response.statusText === 'Unauthorized') {
                this.setState({showLoginModal: true});
            }
            if (error.response !== undefined &&
                error.response.status === 400) {
                console.log(error.response.data.error);
                // they probably gave an illegal filename
                this.setState({ });
            }
        });
    }

    handleToggle(node, toggled) {
        if (node.untitled || (!('children' in node) && node.empty)) {
            console.log('returning');
            return;
        }
        let newFiles = _.cloneDeep(this.state.files);
        let newNode = this.getNodeFromPathList(newFiles, utils.getNodePathList(node));
        let newCursor = this.getNodeFromPathList(newFiles, utils.getNodePathList(this.state.cursor));

        if (!("children" in node)) {
            newNode.active = true;
            if (!_.isEmpty(this.state.cursor)) {
                newCursor.active = false;
            }
            this.setState({cursor: newNode});
        }

        if ('children' in node) {
            newNode.toggled = toggled;
        }
        if ('children' in node && toggled && node.loading) {
            this.fetchDirectoryContents(newNode);
        } else {
            this.fetchFileContents(newNode);
        }

        this.setState({files: newFiles});
    }

    handleNewFile(e, data, target) {
        if (data === undefined) {
            // top level file
            if (e === 'new-file') {
                let newNode = {
                    name: undefined,
                    untitled: true,
                };
                let newFiles = _.cloneDeep(this.state.files);
                newFiles.push(newNode);
                this.setState({
                    files: newFiles,
                });
            } else if (e === 'new-directory') {
                let newNode = {
                    name: undefined,
                    untitled: true,
                    empty: true,
                    children: [{
                        name: '(empty)',
                        empty: true,
                        readOnly: true,
                    }],
                };
                let newFiles = _.cloneDeep(this.state.files);
                let fileIndex = _.findIndex(this.state.files, (o) => {return !("children" in o)});
                if (fileIndex === -1) {
                    newFiles.push(newNode);
                } else {
                    newFiles.splice(fileIndex, 0, newNode);
                }
                this.setState({
                    files: newFiles,
                });
            } else {
                console.log('unknown action');
            }
        } else {
            e.stopPropagation();
            let pathList = target.children[0].id.split('/');
            let newFiles = _.cloneDeep(this.state.files);
            let newCurNode = this.getNodeFromPathList(newFiles, pathList);

            // this.ensureDirectoryTree(newCurNode);
            let newNode;
            if (data.action === 'new-file') {
                newNode = {
                    name: undefined,
                    untitled: true,
                    directory: newCurNode,
                };
            } else if (data.action === 'new-directory') {
                newNode = {
                    name: undefined,
                    untitled: true,
                    directory: newCurNode,
                    children: [{
                        name: '(empty)',
                        empty: true,
                        readOnly: true,
                    }],
                };

            } else {
                console.log('unknown action');
            }
            if (newCurNode.empty) {
                newCurNode.empty = false;
                newCurNode.children = [newNode];
            } else {
                if (data.action === 'new-file') {
                    newCurNode.children.push(newNode);
                } else {
                    let fileIndex = newCurNode.children.findIndex(
                        (o) => {return !("children" in o)}
                    );
                    if (fileIndex === -1) {
                        fileIndex = newCurNode.children.length;
                    }
                    newCurNode.children =
                        newCurNode.children.slice(0, fileIndex)
                            .concat(newNode)
                            .concat(newCurNode.children.slice(fileIndex));
                }
            }
            let animating;
            if (!newCurNode.toggled) {
                newCurNode.toggled = true;
                animating = true;
            }
            newCurNode.loading = false;
            this.setState({
                files: newFiles,
                animating: animating,
            });
        }
    }

    restoreSession(accessToken) {
        let headers = {};
        if (accessToken.length !== 0) {
            headers = {'Authorization': 'Bearer ' + accessToken};
        }
        axios.post(
            consts.SESSION_URL,
            {
                // TODO: this should be a path list
                name: this.state.filename,
                project: this.state.project,
                directory: true,
            },
            {headers: headers},
        )
        .then(response => {
            let files = response.data.files.map(obj => {
                if (obj.directory) {
                    delete obj.directory;
                    obj['children'] = [];
                    obj['loading'] = true;
                } else {
                    delete obj.directory;
                }
                if (obj['library']) {
                    obj['readOnly'] = true;
                }
                return obj;
            });
            this.setState({
                filename: response.data.filename || this.state.filename,
                inputFilename: response.data.filename || this.state.inputFilename,
                scene: response.data.scene || this.state.scene,
                selectedScene: response.data.scene || this.state.scene,
                files: files || this.state.files,
                code: response.data.code || this.state.code,
                project: response.data.project || this.state.project,
            });
            if ('username' in response.data) {
                this.props.onSessionRestore(response.data['username'])
            }
        })
        .catch(error => {
            if ('response' in error && 'data' in error.response) {
                let data = error.response.data;
                console.log(data);
                if (error.response.status === 401 &&
                    data.code === 'token_not_valid' &&
                    data.detail === 'Given token not valid for any token type') {
                    alert('your token has expired, please log in again');
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
                movingFile: false,
            });
        }
    }

    fetchFileContents(node) {
        // double clicking a directory has no effect
        if ('children' in node) {
            return;
        }
        let headers = {};
        if (this.props.access.length !== 0) {
            headers = {'Authorization': 'Bearer ' + this.props.access};
        }
        axios.post(
            consts.GET_FILES_URL,
            {
                project: node.project,
                pathList: utils.getNodePathList(node),
            },
            {headers: headers},
        )
        .then(response => {
            let displayingLibraryCode;
            if (node.directory !== undefined && node.directory['library']) {
                displayingLibraryCode = true;
            }
            this.setState({
                filename: utils.getNodePathList(node).join('/'),
                code: response.data['content'],
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

    getNodeFromPathList(rootList, pathList) {
        let currentNode;
        let currentChildren = rootList;
        for (let i = 0; i < pathList.length; i++) {
            let entry = pathList[i];
            for (let j = 0; j < currentChildren.length; j++) {
                let child = currentChildren[j];
                if (child['name'] === entry) {
                    currentNode = child;
                    currentChildren = child.children;
                    break;
                } 
            }
        } 
        return currentNode;
    }

    fetchDirectoryContents(node) {
        let pathList = utils.getNodePathList(node);
        
        let headers = {};
        if (this.props.access.length !== 0) {
            headers = {'Authorization': 'Bearer ' + this.props.access};
        }
        axios.post(
            consts.GET_FILES_URL,
            {
                project: node.project,
                pathList: pathList,
            },
            {headers: headers},
        )
        .then(response => {
            let newFiles = _.cloneDeep(this.state.files);
            let newNode = this.getNodeFromPathList(newFiles, pathList);
            if (response.data.length !== 0) {
                let files = response.data.map(obj => {
                    if (obj.directory) {
                        obj['children'] = [];
                        obj['loading'] = true;
                        obj['directory'] = node;
                    } else {
                        obj['directory'] = node;
                    }
                    if (node['library']) {
                        obj['library'] = true;
                        obj['readOnly'] = true;
                    }
                    return obj;
                });
                newNode['children'] = files;
            } else {
                newNode['empty'] = true;
                newNode['children'] = [{
                    name: '(empty)',
                    empty: true,
                    readOnly: true,
                }];
            }
            newNode['loading'] = false;
            this.setState({files:newFiles});
        })
        .catch(error => {
            console.log(error);
            console.log(error.data);
        })
    }

    handleCodeChange(newValue) {
        this.setState({code: newValue});
    }

    handleSceneChange(event) {
        this.setState({scene: event.target.value});
    }

    handleFilenameChange(event) {
        this.setState({filename: event.target.value});
    }

    handleInputFilenameChange(event) {
        this.setState({inputFilename: event.target.value});
    }

    logOut() {
        // TODO: go to homepage
        this.props.onLogOut();
        this.restoreSession('');
        this.setState({
            selectedScene: consts.DEFAULT_SELECTED_SCENE,
            returncode: -1,
            error: consts.DEFAULT_LOGS,
            saveMessage: "",
        });
    }

    handleRenderFinished(responseData) {
        if (responseData.result['returncode'] === 0) {
            // a hack to get the video component to reload
            this.setState({selectedScene: ''});
            this.setState({
                error: responseData.result['stderr'],
                returncode: 0,
                selectedScene: responseData['scene'],
                selectedFile: responseData['filename'],
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
                error: error,
                returncode: responseData.result['returncode'] || -1,
                selectedScene: responseData['scene'] || '',
            });
        }
    }

    checkRender(job_id) {
        axios.get(consts.CHECK_RENDER_URL, {
            params: {
                'job_id': job_id,
            }
        })
        .then(response => {
            if ('status' in response.data) {
                let renderStatus = response.data['status'];
                if (renderStatus === 'finished') {
                    clearInterval(this.state['renderTimer']);
                    this.handleRenderFinished(response.data);
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

    // TODO: rendering points to the wrong file
    handleRender() {
        let headers = {};
        if (this.props.access.length !== 0) {
            headers = {'Authorization': 'Bearer ' + this.props.access};
        }
        axios({
            method: 'post',
            url: consts.RENDER_URL,
            headers: headers,
            data: {
                filename: this.state.inputFilename,
                scene: this.state.scene,
                project: this.state.project,
            }
        })
        .then(response => {
            if ('authorization' in response.headers) {
                this.props.onSignUp(response.headers['authorization']);
                return;
            }
            if ('job_id' in response.data) {
                clearInterval(this.state['renderTimer']);
                let checkRenderTimer = setInterval(
                    () => {this.checkRender(response.data['job_id'])},
                    consts.CHECK_RENDER_INTERVAL_MS,
                );
                this.setState({
                    renderTimer: checkRenderTimer,
                });
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
        let headers;
        if (this.props.access.length !== 0) {
            headers = {'Authorization': 'Bearer ' + this.props.access};
        } else {
            headers = {};
        }
        axios.post(
            consts.SAVE_URL,
            {
                // TODO: this should be a path list
                name: this.state.filename,
                project: this.state.project,
                scene: this.state.scene,
                code: this.state.code,
                directory: false,
            },
            {headers: headers},
        )
        .then(response => {
            this.setState({
                filename: response.data.filename,
                saveMessage: "saved",
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
                this.setState({ });
            }
        });
    }

    render() {
        let login_info = '';
        if (this.props.username.length !== 0) {
            login_info = (
                <div className='account-info'>
                    <div className="banner-button emphatic-button">
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
        let loginModal;
        if (this.state.showLoginModal) {
		    loginModal = (
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
                </div>
            );
        }
        let fileModal;
        if (this.state.movingFile) {
            let newFiles = _.cloneDeep(this.state.files);
            newFiles.forEach((node) => {
                if (!node.library && 'children' in node) {
                    this.ensureDirectoryTree(node); 
                }
            });
		    fileModal = (
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
                    <div className="directory-select">
                        <ul>
                        <li>root</li>
                        {this.listDirs(this.state.files)}
                        </ul>
                    </div>
                </div>
            );
        }
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
                            </div>
                        </div>
                    </NavLink>
                    {this.props.username}
                    {login_info}
                </div>
                <div className="app-container">
                    <NotVideo
                        error={this.state.error}   
                        scene={this.state.selectedScene}
                        returncode={this.state.returncode}
                        username={this.props.username}
                        project={this.state.project}
                        filename={this.state.selectedFile}
                    />
                    <Editor
                        code={this.state.code}
                        filename={this.getPathBaseName(this.state.filename)}
                        scene={this.state.scene}
                        files={this.state.files}
                        cursor={this.state.cursor}
                        inputFilename={this.state.inputFilename}
                        readOnly={this.state.displayingLibraryCode || this.props.access.length === 0}
                        saveMessage={this.state.saveMessage}
                        animating={this.state.animating}

                        onSave={this.handleSave}
                        onSceneChange={this.handleSceneChange}
                        onFilenameChange={this.handleFilenameChange}
                        onInputFilenameChange={this.handleInputFilenameChange}
                        onRender={this.handleRender} 
                        onCodeChange={this.handleCodeChange}
                        onNewFile={this.handleNewFile}
                        onToggle={this.handleToggle}
                        onNewFileName={this.handleNewFileName}
                        onFileRename={this.handleFileRename}
                        onFileMove={this.handleFileMove}
                        onFileDelete={this.handleFileDelete}
                        onSetAutosaveTimeout={this.handleSetAutosaveTimeout}
                        onAnimationComplete={this.handleAnimationComplete}
                    />
                </div>
                {loginModal}
                {fileModal}
            </div>
        );
    }
};

export default withRouter(withCookies(App));
