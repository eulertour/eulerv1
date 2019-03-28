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
import Tree, { renderers } from 'react-virtualized-tree';
import 'react-virtualized/styles.css';
import 'react-virtualized-tree/lib/main.css';
import 'material-icons/css/material-icons.css';
import 'material-icons/iconfont/material-icons.css';

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

const NodeNameRenderer = ({node}) => {
    let iconComponent;
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
            />
        );
    }
    let style = {};
    if (node.untitled) {
        // return (
        //     <input
        //         ref={(input) => {this.nameInput = input}}
        //         value={this.state.newFileName}
        //         onChange={(event) => {
        //             this.setState({newFileName: event.target.value});
        //         }}
        //         onKeyDown={(event) => {
        //             if (event.keyCode === 13) {
        //                 this.nameNewFile(node);
        //             }
        //         }}
        //         onBlur={() => {
        //             this.nameNewFile(node);
        //         }}
        //     />
        // );
    } else if (node.active) {
        style['color'] = '#FFFFFF';
    } else if (node.readOnly) {
        style['color'] = '#666666';
    } else {
        style['color'] = 'inherit';
    }
    return (
        <span style={style} className={"tree-text" + (node.children === undefined ? " no-children" : "")}>
            {iconComponent}
            {node.name}
        </span>
    );
};

const style = {
    tree: {
        base: {
            width: 'fit-content',
            minWidth: '100%',
            listStyle: 'none',
            backgroundColor: '#fbfbfb',
            marginTop: '3px',
            marginLeft: '11px',
            padding: 0,
            color: 'black',
            fontFamily: 'Lato, sans-serif',
        },
        node: {
            base: {
                position: 'relative',
            },
            link: {
                cursor: 'pointer',
                position: 'relative',
                padding: '0px 5px',
                display: 'flex',
                fill: '#b43daf',
            },
            activeLink: {
                backgroundColor: '#b43daf',
                color: 'white',
                fill: 'white',
            },
            toggle: {
                base: {
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    marginRight: '7px',
                },
                wrapper: {},
                height: 12,
                width: 12,
                arrow: {
                    strokeWidth: 0
                }
            },
            header: {
                base: {
                    display: 'inline-block',
                    fontSize: '14px',
                    verticalAlign: 'top',
                },
                connector: {
                    width: '2px',
                    height: '12px',
                    borderLeft: 'solid 2px black',
                    borderBottom: 'solid 2px black',
                    position: 'absolute',
                    top: '0px',
                    left: '-21px'
                },
                title: {
                    lineHeight: '24px',
                    verticalAlign: 'middle'
                }
            },
            subtree: {
                listStyle: 'none',
                paddingLeft: '19px'
            },
            loading: {
                color: '#E2C089'
            },
        }
    }
};

class TreeExample extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            animating: false,
            newFileName: "",
        };
    }

    componentDidUpdate() {
        if (!this.props.animating) {
            this.focusInput();
        }
    }

    focusInput() {
        if (this.nameInput) {
            this.nameInput.focus();
        }
    }

    nameNewFile(node) {
        this.props.onNewFileName(node, this.state.newFileName.slice());
        this.setState({newFileName: ""});
    }

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
                <div className="treebeard-container">
                <PerfectScrollbar>
                    <Tree
                        nodes={this.props.files}
                        onChange={this.props.onTreeChange}
                        nodeMarginLeft={20}
                        width={400}
                        autoHeight={true}           // prevent react-virtualized from scrolling vertically
                        overscanRowCount={Infinity} // disable virtualization
                    >
                        {({style, node, ...props}) => {
                            return (
                                <div style={style}>
                                    <renderers.Expandable
                                        node={node}
                                        style={style}
                                        iconsClassNameMap = {{
                                            expanded: 'tree-cursor expanded',
                                            collapsed: 'tree-cursor collapsed',
                                        }}
                                        onChange={(update) => {
                                            props.onChange(update);
                                            if (update.node.state.expanded &&
                                                update.node.loading) {
                                                this.props.onDirFetch(update.node);
                                            } else {
                                                this.props.onFileFetch(update.node);
                                            }
                                        }}
                                    >
                                        <NodeNameRenderer node={node}/>
                                    </renderers.Expandable>
                                </div>
                            )}}
                    </Tree>
                </PerfectScrollbar>
                </div>
            </div>
        );
    }
}

export default TreeExample;

// <Treebeard
//     data={this.props.files}
//     onToggle={(node, toggled) => {
//         if ('toggled' in node && node.toggled !== toggled) {
//             this.setState({animating: true});
//         }
//         this.props.onToggle(node, toggled);
//     }}
//     style={style}
//     decorators={decorators}
//     animations={false}
// />
