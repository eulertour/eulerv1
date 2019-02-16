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
            selectedScene: "",
            selectedFile: "",
            filename: "",
            oldName: "",
            code: "",
            scene: "",
            inputFilename: "",
            cursor: {},
            project: "",
            showLoginModal: false,
            renderTimer: -1,
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
        this.handleExpandDirectory = this.handleExpandDirectory.bind(this);
        this.handleSelectNode = this.handleSelectNode.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.handleModalClick = this.handleModalClick.bind(this);
    }

    restoreSession(accessToken) {
        let headers = {};
        if (accessToken.length !== 0) {
            headers = {'Authorization': 'Bearer ' + accessToken};
        }
        axios({
            method: 'post',
            url: consts.SESSION_URL,
            headers: headers,
        })
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
                    obj['override'] = {
                        color: '#666666',
                    }
                }
                return obj;
            });
            this.setState({
                filename: response.data.filename || this.state.filename,
                inputFilename: response.data.filename || this.state.inputFilename,
                oldName: response.data.filename || this.state.filename,
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

    handleDoubleClick(node) {
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
                pathList: this.getNodePathList(node),
            },
            {headers: headers},
        )
        .then(response => {
            let displayingLibraryCode;
            if (node.directory !== undefined && node.directory['library']) {
                displayingLibraryCode = true;
            }
            this.setState({
                filename: node.name,
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

    handleExpandDirectory(node) {
        let pathList = this.getNodePathList(node);
        
        axios.post(
            consts.GET_FILES_URL,
            {
                project: node.project,
                pathList: pathList,
            },
        )
        .then(response => {
            let newFiles = _.cloneDeep(this.state.files);
            let newNode = this.getNodeFromPathList(newFiles, pathList);
            // let child_key, child;
            let files = response.data.map(obj => {
                if (obj.directory) {
                    obj['children'] = [];
                    obj['loading'] = true;
                    obj['directory'] = newNode;
                } else {
                    obj['directory'] = newNode;
                }
                if (newNode['library']) {
                    obj['library'] = true;
                    obj['override'] = {
                        color: '#666666',
                    }
                }
                return obj;
            });
            newNode['children'] = files;
            newNode['loading'] = false;
            newNode['toggled'] = true;
            newNode['active'] = true;
            this.setState({
                files: newFiles,
                cursor: newNode,
            });
        })
        .catch(error => {
            console.log(error);
            console.log(error.data);
        })
    }

    handleSelectNode(node, toggled) {
        node.active = true;
        node.toggled = toggled;
        this.setState({cursor: node});
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
        });
    }

    handleRenderFinished(renderResult) {
        if (renderResult['returncode'] === 0) {
            // a hack to get the video component to reload
            this.setState({selectedScene: ''});
            this.setState({
                error: renderResult['stderr'],
                returncode: 0,
                selectedScene: renderResult['scene'],
                selectedFile: this.state.filename,
            });
        } else {
            let error;
            if (renderResult['stderr'].length !== 0) {
                error = renderResult['stderr'];
            } else if (renderResult['stdout'] !== 0) {
                error = renderResult['stdout'];
            } else {
                error = renderResult['error'];
            }
            this.setState({
                error: error,
                returncode: renderResult['returncode'] || -1,
                selectedScene: renderResult['scene'] || '',
                oldName: this.state.filename,
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
                    this.handleRenderFinished(response.data['result']);
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
                this.setState({ renderTimer: checkRenderTimer });
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
        // TODO: implement save-on-signup
        let headers;
        if (this.props.access.length !== 0) {
            headers = {'Authorization': 'Bearer ' + this.props.access};
        } else {
            headers = {};
        }
        // axios({
        //     method: 'post',
        //     url: consts.SAVE_URL,
        //     headers: headers,
        //     name: this.state.filename,
        //     code: this.state.code,
        //     scene: this.state.scene,
        // })
        axios.post(
            consts.SAVE_URL,
            {
                name: this.state.filename,
                project: this.state.project,
                scene: this.state.scene,
                code: this.state.code,
            },
            {headers: headers},
        )
        .then(response => {
            this.setState({
                filename: response.data.filename,
                oldName: response.data.filename,
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
                this.setState({
                    filename: this.state.oldName,
                })
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
                        filename={this.state.filename}
                        scene={this.state.scene}
                        oldName={this.state.oldName}
                        files={this.state.files}
                        cursor={this.state.cursor}
                        inputFilename={this.state.inputFilename}
                        readOnly={this.state.displayingLibraryCode}

                        onSave={this.handleSave}
                        onSceneChange={this.handleSceneChange}
                        onFilenameChange={this.handleFilenameChange}
                        onInputFilenameChange={this.handleInputFilenameChange}
                        onRender={this.handleRender} 
                        onCodeChange={this.handleCodeChange}
                        onRename={this.handleRename}
                        onExpandDirectory={this.handleExpandDirectory}
                        onSelectNode={this.handleSelectNode}
                        onDoubleClick={this.handleDoubleClick}
                    />
                </div>
                {modal}
            </div>
        );
    }
}

export default withRouter(withCookies(App));
