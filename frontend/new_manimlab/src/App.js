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
            newFileName: "",
            namingNewFile: false,
        }
        this.logOut = this.logOut.bind(this);
        this.restoreSession = this.restoreSession.bind(this);
        this.handleRename = this.handleRename.bind(this);
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
        this.handleAutosaveTimeout = this.handleAutosaveTimeout.bind(this);
        this.handleNewFile = this.handleNewFile.bind(this);
        this.handleNewDirectory = this.handleNewDirectory.bind(this);
        this.handleDirectoryName = this.handleDirectoryName.bind(this);
        this.handleToggle = this.handleToggle.bind(this);
        this.handleNewFileNameChange=this.handleNewFileNameChange.bind(this);
    }

    handleNewFileNameChange(event) {
        this.setState({newFileName: event.target.value});
    }

    handleDirectoryName(node) {
        // TODO: will fail for non top-level dirs
        let newFiles = _.cloneDeep(this.state.files);

        // check if the name is taken
        if (_.find(this.state.files,
            (o) => {return o.name === this.state.newFileName})) {
            alert('name is taken');
            _.remove(newFiles, (o) => {return _.isEqual(o, node)});
            this.setState({
                files: newFiles,
                namingNewFile: false,
                newFileName: '',
            });
            return;
        }
        

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
                name: this.state.newFileName,
                project: this.state.project,
                directory: "children" in node,
            },
            {headers: headers},
        )
        .then(response => {
            let newFiles = _.cloneDeep(this.state.files);
            let newNode = _.find(newFiles, (o) => {return _.isEqual(o, node)});
            newNode['untitled'] = false;
            newNode['name'] = this.state.newFileName;
            newNode['project'] = this.state.project;

            if ('children' in node) {
                // sort the directories
                // TODO: actually check the number of lib dirs
                let libraryDirs = newFiles.slice(0, 1);
                newFiles = newFiles.slice(1);
                // TODO: handle non top-level dirs
                let fileIndex = newFiles.findIndex(
                    (o) => {return !("children" in o)}
                );
                if (fileIndex === -1) {
                    fileIndex = newFiles.length();
                }
                let subarray = newFiles.slice(0, fileIndex);
                subarray = subarray.sort((o1, o2) => {
                    if (o1.name < o2.name)
                        return -1;
                    else if (o1.name > o2.name)
                        return 1;
                    else
                        return 0;
                });
                let rest = newFiles.slice(fileIndex);
                subarray = subarray.concat(rest);
                this.setState({
                    files: libraryDirs.concat(subarray),
                    namingNewFile: false,
                    newFileName: '',
                });
            } else {
                // sort the files
                // TODO: actually check the number of lib dirs
                let libraryDirs = newFiles.slice(0, 1);
                newFiles = newFiles.slice(1);
                // TODO: handle non top-level dirs
                let fileIndex = newFiles.findIndex(
                    (o) => {return !("children" in o)}
                );
                let subarray = newFiles.slice(fileIndex);
                subarray = subarray.sort((o1, o2) => {
                    if (o1.name < o2.name)
                        return -1;
                    else if (o1.name > o2.name)
                        return 1;
                    else
                        return 0;
                });
                let rest = newFiles.slice(0, fileIndex);
                subarray = rest.concat(subarray);
                this.setState({
                    files: libraryDirs.concat(subarray),
                    namingNewFile: false,
                    newFileName: '',
                });
            }
        })
        .catch(error => {
            _.remove(newFiles, (o) => {return _.isEqual(o, node)});
            this.setState({
                files: newFiles,
                namingNewFile: false,
                newFileName: '',
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
        if (node.untitled || node.empty) {
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

    handleNewDirectory() {
        let newNode = {
            name: undefined,
            untitled: true,
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
            namingNewFile: true,
        });
    }

    handleNewFile() {
        let newNode = {
            name: undefined,
            untitled: true,
        };
        let newFiles = _.cloneDeep(this.state.files);
        newFiles.push(newNode);
        this.setState({
            files: newFiles,
            namingNewFile: true,
        });
        // let curNode = this.state.cursor;
        // let pathList = utils.getNodePathList(curNode);

        // let newFiles = _.cloneDeep(this.state.files);
        // let newCurNode = this.getNodeFromPathList(newFiles, pathList);

        // let newNode = {
        //     name: 'newFile',
        // };
        // newCurNode['toggled'] = true;
        // console.log(newCurNode);
        // if ("children" in newCurNode) {
        //     // create under this directory
        //     newCurNode.children.push(newNode);
        // } else if ("directory" in newCurNode) {
        //     // create under parent directory
        //     newCurNode.directory.children.push(newNode);
        // } else {
        //     // create at top level
        //     newFiles.push(newNode);
        // }
        // this.setState({
        //     files: newFiles,
        //     cursor: newCurNode,
        // });
    }

    handleAutosaveTimeout() {
        this.setState({saveMessage: ""});
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
                name: this.state.newFileName,
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
            this.setState({showLoginModal: false});
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

    handleRename(event) {
        let renameIndex = this.props.files.indexOf(this.state.filename);
        let newModules = this.props.files.slice();
        newModules[renameIndex] = event.target.value;
        // set old name so backend knows to rename
        this.setState({
            oldName: this.state.filename,
            filename: event.target.value,
            files: newModules,
        });
        this.props.onRename(newModules);
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
        let modal;
        if (this.state.showLoginModal) {
            // add redirect or something
		    modal = (
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
                        }}
                    />
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
                        newFileName={this.state.newFileName}
                        namingNewFile={this.state.namingNewFile}

                        onSave={this.handleSave}
                        onSceneChange={this.handleSceneChange}
                        onFilenameChange={this.handleFilenameChange}
                        onInputFilenameChange={this.handleInputFilenameChange}
                        onRender={this.handleRender} 
                        onCodeChange={this.handleCodeChange}
                        onRename={this.handleRename}
                        onExpandDirectory={this.fetchDirectoryContents}
                        onSelectNode={this.handleSelectNode}
                        onSetAutosaveTimeout={this.handleAutosaveTimeout}
                        onNewFile={this.handleNewFile}
                        onNewDirectory={this.handleNewDirectory}
                        onToggle={this.handleToggle}
                        onDirectoryName={this.handleDirectoryName}
                        onFileName={this.handleDirectoryName}
                        onNewFileNameChange={this.handleNewFileNameChange}
                    />
                </div>
                {modal}
            </div>
        );
    }
};

export default withRouter(withCookies(App));
