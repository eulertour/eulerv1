import React from 'react';
import { Treebeard } from 'react-treebeard';
import newFileIcon from '../assets/icon-new-file@3x.svg';
import newDirIcon from '../assets/icon-new-dir@3x.svg';
import collapseTreeIcon from '../assets/icon-left@3x.svg';
import PerfectScrollbar from 'react-perfect-scrollbar';
import _ from 'lodash';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import * as utils from '../utils.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
    faAlignLeft,
    faFolder,
    faSuperscript,
    faPencilAlt,
    faLongArrowAltRight,
    faArrowRight,
    faTrash,
    faFile,
    faFolderOpen
} from '@fortawesome/free-solid-svg-icons'
import { faPython } from '@fortawesome/free-brands-svg-icons'
import VTree, { renderers } from 'react-virtualized-tree';
import 'react-virtualized/styles.css';
import 'react-virtualized-tree/lib/main.css';
import 'material-icons/css/material-icons.css';
import 'material-icons/iconfont/material-icons.css';
import { Tree, Icon } from 'antd';

const { TreeNode } = Tree;

library.add(
    faAlignLeft,
    faFolder,
    faPython,
    faSuperscript,
    faPencilAlt,
    faLongArrowAltRight,
    faArrowRight,
    faTrash,
    faFile,
    faFolderOpen
);

class TreeExample extends React.PureComponent {
    constructor(props){
        super(props);
        this.state = {
            animating: false,
            newFileName: "",
            expandedKeys: [],
        };
    }

    componentDidUpdate() {
        if (this.nameInput) {
            this.nameInput.focus();
        }
    }

    nameNewFile(node) {
        this.props.onNewFileName(node, this.state.newFileName.slice());
        this.setState({newFileName: ""});
    }

    renderTreeNodes(data) {
        return data.map((node) => {
            let title;
            let iconComponent = null;
            if (node.untitled) {
                title = (
                    <input
                        ref={(input) => {this.nameInput = input}}
                        value={this.state.newFileName}
                        onChange={(event) => {
                            this.setState({newFileName: event.target.value});
                        }}
                        onKeyDown={(event) => {
                            if (event.keyCode === 13) {
                                this.nameNewFile(node);
                            }
                        }}
                        onBlur={() => {
                            this.nameNewFile(node);
                        }}
                    />
                );
            } else {
                let color = 'black';
                if (node.readOnly) {
                    color = '#666666';
                }
                let iconName;
                let iconPrefix = "fas";
                let className = "tree-text-container";
                if (!('children' in node) && node.empty) {
                    iconComponent = null;
                } else {
                    if ('children' in node) {
                        iconName = "folder";
                    } else {
                        className += " tree-left-pad";
                        if (node.name.endsWith(".py")) {
                            iconPrefix = "fab";
                            iconName = "python";
                        } else if (node.name.endsWith(".tex")) {
                            iconName = "superscript";
                        } else {
                            iconName = "align-left";
                        }
                    }
                    iconComponent = (
                        <FontAwesomeIcon
                            className="tree-icon"
                            icon={[iconPrefix, iconName]}
                            style={{color: color}}
                        />
                    );
                }
                let newFile;
                let newDir;
                let rename;
                let del;
                if (!node.library && !(node.empty && !node.children)) {
                    if ('children' in node) {
                        newFile = (
                            <React.Fragment>
                                <MenuItem
                                    data={{action: 'new-file'}}
                                    onClick={(e, data, target) => {
                                        let expandedKey = target.children[0].id;
                                        let nodeNotExpanded = (
                                            _.findIndex(
                                                this.state.expandedKeys,
                                                (key) => {return key === expandedKey}
                                            ) === -1
                                        );
                                        if (nodeNotExpanded) {
                                            let clickedNode = utils.getNodeFromPathList(
                                                this.props.files,
                                                target.children[0].id.split('/'),
                                            );
                                            let expandAndCreateNewFile = () => {
                                                let newExpandedKeys = _.clone(this.state.expandedKeys);
                                                newExpandedKeys.push(expandedKey);
                                                this.setState(
                                                    {expandedKeys: newExpandedKeys},
                                                    () => {this.props.onNewFile(e, data, target)},
                                                );
                                            }
                                            if (clickedNode.loading) {
                                                this.props.onDirFetch(
                                                    clickedNode,
                                                    expandAndCreateNewFile,
                                                );
                                            } else {
                                                expandAndCreateNewFile();
                                            }
                                        } else {
                                            this.props.onNewFile(e, data, target);
                                        }
                                    }}>
                                    <FontAwesomeIcon
                                        className="menu-icon"
                                        icon={["fas", "file"]}
                                    />
                                    New File
                                </MenuItem>
                                <MenuItem divider />
                            </React.Fragment>
                        );
                        newDir = (
                            <React.Fragment>
                                <MenuItem
                                    data={{action: 'new-directory'}}
                                    onClick={(e, data, target) => {
                                        let expandedKey = target.children[0].id;
                                        let nodeNotExpanded = (
                                            _.findIndex(
                                                this.state.expandedKeys,
                                                (key) => {return key === expandedKey}
                                            ) === -1
                                        );
                                        if (nodeNotExpanded) {
                                            let clickedNode = utils.getNodeFromPathList(
                                                this.props.files,
                                                target.children[0].id.split('/'),
                                            );
                                            let expandAndCreateNewFile = () => {
                                                let newExpandedKeys = _.clone(this.state.expandedKeys);
                                                newExpandedKeys.push(expandedKey);
                                                this.setState(
                                                    {expandedKeys: newExpandedKeys},
                                                    () => {this.props.onNewFile(e, data, target)},
                                                );
                                            }
                                            if (clickedNode.loading) {
                                                this.props.onDirFetch(
                                                    clickedNode,
                                                    expandAndCreateNewFile,
                                                );
                                            } else {
                                                expandAndCreateNewFile();
                                            }
                                        } else {
                                            this.props.onNewFile(e, data, target);
                                        }
                                    }}>
                                    <FontAwesomeIcon
                                        className="menu-icon"
                                        icon={["fas", "folder-open"]}
                                    />
                                    New Folder
                                </MenuItem>
                                <MenuItem divider />
                            </React.Fragment>
                        );
                    }
                    rename = (
                        <React.Fragment>
                            <MenuItem
                                data={{action: 'rename'}}
                                onClick={this.props.onFileRename}>
                                <FontAwesomeIcon
                                    className="menu-icon"
                                    icon={["fas", "pencil-alt"]}
                                />
                                Rename
                            </MenuItem>
                            <MenuItem divider />
                        </React.Fragment>
                    );
                    del = (
                        <React.Fragment>
                            <MenuItem
                                data={{action: 'delete'}}
                                onClick={this.props.onFileDelete}>
                                <FontAwesomeIcon
                                    className="menu-icon"
                                    icon={["fas", "trash"]}
                                />
                                Delete
                            </MenuItem>
                        </React.Fragment>
                    );
                }
                let path = utils.getNodePathList(node).join('/');
                title = (
                    <span style={{color: color}}>
                        <ContextMenuTrigger id={path}>
                            <span id={path}>{node.name}</span>
                        </ContextMenuTrigger>
                        <ContextMenu id={path}>
                            {newFile}
                            {newDir}
                            {rename}
                            {del}
                        </ContextMenu>
                    </span>
                );
            }
            if (node.children) {
                return (
                    <TreeNode
                        title={title}
                        key={node.id}
                        dataRef={node}
                        icon={iconComponent}
                        selectable={false}
                    >
                        {this.renderTreeNodes(node.children)}
                    </TreeNode>
                );
            }
            return (
                <TreeNode
                    title={title}
                    key={node.id}
                    dataRef={node}
                    icon={iconComponent}
                    isLeaf={true}
                />
            );
        });
    }

    onLoadData = treeNode => new Promise((resolve) => {
        if (!treeNode.props.dataRef.loading) {
            console.log('already available');
            resolve();
            return;
        }
        this.props.onDirFetch(treeNode.props.dataRef);
        resolve();
    })

    render() {
        let decorators = Treebeard.defaultProps.decorators;
        let animations = Treebeard.defaultProps.animations;
        animations.drawer = () => ({
            enter: {
                animation: 'slideDown',
                duration: 300,
                complete: () => {
                    this.props.onAnimationComplete();
                    this.focusInput();
                }
            },
            leave: {
                animation: 'slideUp',
                duration: 300
            }
        });
        decorators['Header'] = ({node, style}) => {
            if (style === undefined) {
                return null;
            } else {
                style = _.cloneDeep(style);
            }
            if (node.untitled) {
                return (
                    <input
                        ref={(input) => {this.nameInput = input}}
                        value={this.state.newFileName}
                        onChange={(event) => {
                            this.setState({newFileName: event.target.value});
                        }}
                        onKeyDown={(event) => {
                            if (event.keyCode === 13) {
                                this.nameNewFile(node);
                            }
                        }}
                        onBlur={() => {
                            this.nameNewFile(node);
                        }}
                    />
                );
            } else if (node.active) {
                style.title['color'] = '#FFFFFF';
            } else if (node.readOnly) {
                style.title['color'] = '#666666';
            } else {
                style.title['color'] = 'inherit';
            }
            let path = utils.getNodePathList(node).join('/');
            let iconComponent;
            let iconName;
            let iconPrefix = "fas";
            let className = "tree-text-container";
            if (!('children' in node) && node.empty) {
                iconComponent = null;
            } else {
                if ('children' in node) {
                    iconName = "folder";
                } else {
                    className += " tree-left-pad";
                    if (node.name.endsWith(".py")) {
                        iconPrefix = "fab";
                        iconName = "python";
                    } else if (node.name.endsWith(".tex")) {
                        iconName = "superscript";
                    } else {
                        iconName = "align-left";
                    }
                }
                iconComponent = (
                    <FontAwesomeIcon
                        className="tree-icon"
                        icon={[iconPrefix, iconName]}
                    />
                );
            }
            let newFile;
            let newDir;
            let rename;
            let del;
            if (!node.library && !(node.empty && !node.children)) {
                if ('children' in node) {
                    newFile = (
                        <React.Fragment>
                            <MenuItem
                                data={{action: 'new-file'}}
                                onClick={this.props.onNewFile}>
                                <FontAwesomeIcon
                                    className="menu-icon"
                                    icon={["fas", "file"]}
                                />
                                New File
                            </MenuItem>
                            <MenuItem divider />
                        </React.Fragment>
                    );
                    newDir = (
                        <React.Fragment>
                            <MenuItem
                                data={{action: 'new-directory'}}
                                onClick={this.props.onNewFile}>
                                <FontAwesomeIcon
                                    className="menu-icon"
                                    icon={["fas", "folder-open"]}
                                />
                                New Folder
                            </MenuItem>
                            <MenuItem divider />
                        </React.Fragment>
                    );
                }
                rename = (
                    <React.Fragment>
                        <MenuItem
                            data={{action: 'rename'}}
                            onClick={this.props.onFileRename}>
                            <FontAwesomeIcon
                                className="menu-icon"
                                icon={["fas", "pencil-alt"]}
                            />
                            Rename
                        </MenuItem>
                        <MenuItem divider />
                    </React.Fragment>
                );
                del = (
                    <React.Fragment>
                        <MenuItem
                            data={{action: 'delete'}}
                            onClick={this.props.onFileDelete}>
                            <FontAwesomeIcon
                                className="menu-icon"
                                icon={["fas", "trash"]}
                            />
                            Delete
                        </MenuItem>
                    </React.Fragment>
                );
            }
            return (
                <div>
                    <ContextMenuTrigger id={path}>
                        <div style={style.base} id={path}>
                            <div className={className} style={style.title}>
                                {iconComponent} <span className="tree-text">{node.name}</span>
                            </div>
                        </div>
                    </ContextMenuTrigger>

                    <ContextMenu id={path}>
                        {newFile}
                        {newDir}
                        {rename}
                        {del}
                    </ContextMenu>
                </div>
            );
        }
        return (
            <div className="tree-part">
                <div className="tree-banner">
                    <div id="tree-label">Files</div>
                    <div className="tree-buttons">
                        <div
                            className="new-file-button"
                            onClick={() => this.props.onNewFile('new-file')}
                        >
                            <img
                                className="file-banner-button"
                                src={newFileIcon}
                                alt="new file"
                            />
                        </div>
                        <div
                            className="new-dir-button"
                            onClick={() => this.props.onNewFile('new-directory')}
                        >
                            <img
                                className="folder-banner-button"
                                src={newDirIcon}
                                alt="new directory"
                            />
                        </div>
                        <div
                            className="collapse-button"
                            onClick={this.props.onTreeToggle}
                        >
                            <img
                                className="collapse-icon"
                                src={collapseTreeIcon}
                                alt="collapse tree"
                            />
                        </div>
                    </div>
                </div>
                <div className="tree-container">
                    <PerfectScrollbar>
                        <Tree
                            showIcon
                            switcherIcon={<Icon
                                type="caret-down"
                                style={{
                                    color: '#b43daf',
                                    fontSize: '24px',
                                    width: '16px',
                                }}
                            />}
                            loadData={this.onLoadData}
                            onSelect={(value, e, extra) => {
                                this.props.onFileFetch(e.node.props.dataRef);
                            }}
                            expandedKeys={this.state.expandedKeys}
                            onExpand={(expandedKeys) => {
                                this.setState({expandedKeys});
                            }}
                        >
                            {this.renderTreeNodes(this.props.files)}
                        </Tree>
                    </PerfectScrollbar>
                </div>
            </div>
        );
    }
}

export default TreeExample;
