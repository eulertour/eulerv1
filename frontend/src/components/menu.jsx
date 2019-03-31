import React from 'react';
import _ from 'lodash';
import { ContextMenu, MenuItem } from "react-contextmenu";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
    faFile,
    faFolderOpen,
    faPencilAlt,
    faTrash,
} from '@fortawesome/free-solid-svg-icons'
import * as consts from '../constants.js';

library.add(
    faFile,
    faFolderOpen,
    faPencilAlt,
    faTrash,
);

class FileMenu extends React.PureComponent {
    render() {
        if (!('menuNode' in this.props)) {
            return null;
        }
        if (_.isEmpty(this.props.menuNode)) {
            return null;
        }
        let node = this.props.menuNode;
        let newFile;
        let newDir;
        let rename;
        let del;
        if (!node.library && !(node.empty && !node.children)) {
            if ('children' in node) {
                newFile = (
                    <React.Fragment>
                        <MenuItem
                            data={{action: 'new-file', node: node}}
                            onClick={(e, data, target) => {
                                this.props.onMenuClick(e, data, target);
                            }}
                        >
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
                            data={{action: 'new-directory', node: node}}
                            onClick={(e, data, target) => {
                                this.props.onMenuClick(e, data, target);
                            }}
                        >
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
                        data={{action: 'rename', node: node}}
                        onClick={(e, data, target) => {
                            this.props.onFileRename(e, data, target);
                        }}
                    >
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
                        data={{action: 'delete', node: node}}
                        onClick={(e, data, target) => {
                            this.props.onFileDelete(e, data, target);
                        }}
                    >
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
                <ContextMenu
                    id={consts.MENU_ID}
                    onShow={this.props.onShow}
                    onHide={this.props.onHide}
                >
                    {newFile}
                    {newDir}
                    {rename}
                    {del}
                </ContextMenu>
        );
    }
}

export default FileMenu;
