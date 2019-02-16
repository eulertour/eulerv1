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
        this.onToggle = this.onToggle.bind(this);
    }

    onToggle(node, toggled){
        if ('name' in this.props.cursor) {
            let cur_active_node = this.props.cursor;
            cur_active_node.active = false;
        }
        if ('children' in node && toggled && node.loading) {
            this.props.onExpandDirectory(node);
        } else {
            this.props.onSelectNode(node, toggled);
        }
    }

    render(){
        return (
            <React.Fragment>
                <div className="tree-banner">
                    <div id="tree-label">Files</div>
                    <div className="tree-buttons">
                        <img
                            className="file-banner-button"
                            src={newFileIcon}
                            alt="new file"
                        />
                        <img
                            className="file-banner-button"
                            src={newDirIcon}
                            alt="new directory"
                        />
                        <img
                            className="file-banner-button"
                            src={collapseTreeIcon}
                            alt="collapse tree"
                        />
                    </div>
                </div>
                <div className="treebeard-container">
                    <PerfectScrollbar option={{wheelPropagation: false}} >
                    <Treebeard
                        data={this.props.files}
                        onToggle={this.onToggle}
                        onDblClick={this.props.onDoubleClick}
                        style={style}                
                    />
                    </PerfectScrollbar>
                </div>
            </React.Fragment>
        );
    }
}

export default TreeExample;
