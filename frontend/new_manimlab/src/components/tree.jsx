import React from 'react';
import { Treebeard } from 'react-treebeard';
import newFileIcon from '../assets/icon-new-file@3x.svg';
import newDirIcon from '../assets/icon-new-dir@3x.svg';
import collapseTreeIcon from '../assets/icon-left@3x.svg';
import PerfectScrollbar from 'react-perfect-scrollbar'

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
            override: {
                color: 'blue',
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
                    fontSize: '16px',
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
        this.state = {};
        this.handleToggle = this.handleToggle.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
    }

    componentDidUpdate() {
        if (this.props.namingNewFile) {
            this.nameInput.focus();
        }
    }

    handleNameChange(event) {
        console.log(event); 
    } 

    handleToggle(node, toggled){
        console.log('clicked');
        if (this.props.cursor !== undefined) {
            let cur_active_node = this.props.cursor;
            cur_active_node.active = false;
        }
        if ('children' in node && toggled && node.loading) {
            this.props.onExpandDirectory(node);
        } else {
            this.props.onSelectNode(node, toggled);
        }
    }

    render() {
        let BaseHeader = Treebeard.defaultProps.decorators.Header;
        let decorators = Treebeard.defaultProps.decorators;
        decorators['Header'] = ({node, style}) => {
            if (node.untitled) {
                let callback;
                if ('children' in node) {
                    callback = () => {this.props.onDirectoryName(node)};
                } else {
                    callback = () => {this.props.onFileName(node)};
                }
                return (
                    <input
                        ref={(input) => {this.nameInput = input}}
                        value={this.props.newFileName}
                        onChange={this.props.onNewFileNameChange}
                        onBlur={callback}
                    />
                );
            } else if (node.active) {
                style.title['color'] = '#FFFFFF';
            } else if (node.readOnly) {
                style.title['color'] = '#666666';
            } else {
                style.title['color'] = 'inherit';
            }
            return <BaseHeader node={node} style={style}/>;
        }
        if (!this.props.collapsed) {
            return (
                <div className="tree-part">
                    <div className="tree-banner">
                        <div id="tree-label">Files</div>
                        <div className="tree-buttons">
                            <div
                                className="new-file-button"
                                onClick={this.props.onNewFile}
                            >
                                <img
                                    className="file-banner-button"
                                    src={newFileIcon}
                                    alt="new file"
                                />
                            </div>
                            <div
                                className="new-dir-button"
                                onClick={this.props.onNewDirectory}
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
                        <PerfectScrollbar option={{wheelPropagation: false}} >
						<Treebeard
							data={this.props.files}
							onToggle={this.props.onToggle}
							style={style}                
                            decorators={decorators}
						/>
                        </PerfectScrollbar>
                    </div>
                </div>
            );
        } else {
            return null;
        }
    }
}

export default TreeExample;
