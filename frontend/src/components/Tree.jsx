import React from 'react';
import newFileIcon from '../assets/icon-new-file@3x.svg';
import newDirIcon from '../assets/icon-new-dir@3x.svg';
import collapseTreeIcon from '../assets/icon-left@3x.svg';
import PerfectScrollbar from 'react-perfect-scrollbar';
import _ from 'lodash';
import { ContextMenuTrigger } from 'react-contextmenu';
import * as utils from '../utils.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
    faAlignLeft,
    faFolder,
    faSuperscript,
} from '@fortawesome/free-solid-svg-icons'
import { faPython } from '@fortawesome/free-brands-svg-icons'
import { Tree, Icon } from 'antd';
import Tooltip from "@material-ui/core/Tooltip"
import FileMenu from './Menu.jsx';
import * as consts from '../constants.js';

const { TreeNode } = Tree;

library.add(
    faAlignLeft,
    faFolder,
    faPython,
    faSuperscript,
);

class TreeExample extends React.PureComponent {
    constructor(props, context) {
        super(props);
        this.state = {
            newFileName: "",
            menuNode: {},
            lockNode: {},
        };
        this.handleMenuClick = this.handleMenuClick.bind(this);
    }

    componentDidUpdate() {
        if (this.nameInput) {
            this.nameInput.focus();
        }
    }

    handleMenuClick(e, data, target) {
        let expandedKey = data.node.id;
        let nodeNotExpanded = (
            _.findIndex(
                this.props.expandedKeys,
                (key) => {return key === expandedKey}
            ) === -1
        );
        if (nodeNotExpanded) {
            let clickedNode = utils.getNodeFromPathList(
                this.props.files,
                expandedKey.split('/'),
            );
            let expandAndCreateNewFile = () => {
                let newExpandedKeys = _.clone(this.props.expandedKeys);
                newExpandedKeys.push(expandedKey);
                this.props.onTreeExpand(
                    newExpandedKeys,
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
                if (!('children' in node) && node.empty) {
                    iconComponent = null;
                } else {
                    if ('children' in node) {
                        iconName = "folder";
                    } else {
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
                let path = utils.getNodePathList(node).join('/');
                title = (
                    <span
                        id={path}
                        style={{color: color}}
                        onMouseOver={() => {
                            if (this.state.nodeLock) {
                                this.setState({lockNode: node});
                            } else {
                                this.setState({menuNode: node});
                            }
                        }}
                        onMouseOut={() => {
                            if (this.state.nodeLock) {
                                this.setState({lockNode: {}});
                            } else {
                                this.setState({menuNode: {}});
                            }
                        }}
                    >
                        {node.name}
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
            resolve();
            return;
        }
        this.props.onDirFetch(treeNode.props.dataRef);
        resolve();
    })

    render() {
        return (
            <div className={this.props.treeCollapsed ? "tree-part collapsed" : "tree-part"}>
                <div className="tree-banner">
                    <div id="tree-label">Files</div>
                    <div className="tree-buttons">
                        {this.props.shared ? null :
                            <Tooltip title="New File" placement="top">
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
                            </Tooltip>
                        }
                        {this.props.shared ? null :
                            <Tooltip title="New Folder" placement="top">
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
                            </Tooltip>
                        }
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
                        <ContextMenuTrigger
                            id={consts.MENU_ID}
                            collect={p => p}
                            menuNode={this.state.menuNode}
                        >
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
                                expandedKeys={this.props.expandedKeys}
                                onExpand={(expandedKeys) => {
                                    this.props.onTreeExpand(expandedKeys);
                                }}
                            >
                                {this.renderTreeNodes(this.props.files)}
                            </Tree>
                        </ContextMenuTrigger>
                        <FileMenu
                            menuNode={this.state.menuNode}
                            onShow={() => {
                                this.setState({nodeLock: true});
                            }}
                            onHide={() => {
                                this.setState({
                                    nodeLock: false,
                                    menuNode: this.state.lockNode,
                                })
                            }}
                            onMenuClick={this.handleMenuClick}
                            onFileRename={this.props.onFileRename}
                            onFileDelete={this.props.onFileDelete}
                        />
                    </PerfectScrollbar>
                </div>
            </div>
        );
    }
}

export default TreeExample;
