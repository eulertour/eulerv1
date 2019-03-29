import React from 'react';
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

class FileMenu extends React.Component {
    render() {
            let { node } = this.props;
            let newFile;
            let newDir;
            let rename;
            let del;
            if (!node.library && !(node.empty && !node.children)) {
                if ('children' in node) {
                    newFile = (
                        <React.Fragment>
                            <MenuItem
                                data={{ action: 'new-file', node: node }}
                                onClick={this.props.onMenuClick}
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
                                data={{ action: 'new-directory', node: node }}
                                onClick={this.props.onMenuClick}
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
                            data={{ action: 'rename', node: node }}
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
                            data={{ action: 'delete', node: node }}
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
            <ContextMenu id={consts.MENU_ID}>
                {newFile}
                {newDir}
                {rename}
                {del}
            </ContextMenu>
        );
    }
}

export default FileMenu;
