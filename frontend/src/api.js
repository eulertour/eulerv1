import * as consts from "./constants.js";
import axios from "axios";
import _ from "lodash";
import * as utils from "./utils.js";

export function resetProject(project, access) {
    return axios
        .delete(consts.PROJECT_DELETE_URL, {
            params: { project: project },
            headers: getHeadersDict(access)
        })
        .then(response => {
            let files = response.data.files.map(obj => {
                if (obj.directory) {
                    delete obj.directory;
                    let childrenNotLoaded = consts.CHILDREN_NOT_LOADED;
                    childrenNotLoaded[0]["id"] = childrenNotLoaded[0]["name"];
                    obj["children"] = childrenNotLoaded;
                    obj["loading"] = true;
                } else {
                    delete obj.directory;
                }
                if (obj["library"]) {
                    obj["readOnly"] = true;
                }
                obj["id"] = obj["name"];
                return obj;
            });
            return { ...response, files };
        })
        .catch(error => {
            return error.response;
        });
}

export function deleteFile(
    project,
    access,
    data,
    editorFiles,
    autosaveTimer,
    editorCursor,
    treeExpandedKeys
) {
    let filePath = data.node.id;
    let pathList = filePath.split("/");
    let delNode = utils.getNodeFromPathList(editorFiles, pathList);

    return axios
        .delete(consts.MODULE_DELETE_URL, {
            params: {
                project: project,
                name: filePath,
                directory: "children" in delNode ? 1 : 0
            },
            headers: getHeadersDict(access)
        })
        .then(() => {
            let filesCopy = _.cloneDeep(editorFiles);
            let delNode = utils.getNodeFromPathList(filesCopy, pathList);
            if ("directory" in delNode) {
                _.remove(delNode.directory.children, o => {
                    return _.isEqual(o, delNode);
                });
                if (delNode.directory.children.length === 0) {
                    delNode.directory.children = consts.NO_CHILDREN;
                    delNode.directory.empty = true;
                }
            } else {
                _.remove(filesCopy, o => {
                    return _.isEqual(o, delNode);
                });
            }
            clearTimeout(autosaveTimer);
            if (!_.isEmpty(editorCursor) && !delNode.active) {
                utils.getNodeFromPathList(
                    filesCopy,
                    utils.getNodePathList(editorCursor)
                ).active = false;
            }
            let expandedKeysCopy = [];
            for (let i = 0; i < treeExpandedKeys.length; i++) {
                if (
                    treeExpandedKeys[i].startsWith(delNode.id + "/") ||
                    treeExpandedKeys[i] === delNode.id
                ) {
                    continue;
                }
                expandedKeysCopy.push(treeExpandedKeys[i]);
            }

            return { filesCopy, expandedKeysCopy };
        })
        .catch(error => {
            if (error.response !== undefined) {
                console.log("error deleting file");
            }
        });
}

export function getHeadersDict(accessToken) {
    return accessToken.length !== 0
        ? { Authorization: `Bearer ${accessToken}` }
        : {};
}

export function newFileName(
    node,
    name,
    data,
    siblingList,
    nodeCopy,
    filesCopy,
    project,
    changeSubtreeIds,
    treeExpandedKeys,
    editorFilename,
    editorCursor,
    access
) {
    return axios
        .post(consts.SAVE_URL, data, {
            headers: getHeadersDict(access)
        })
        .then(response => {
            nodeCopy["untitled"] = false;
            nodeCopy["name"] = name;
            nodeCopy["project"] = project;
            let oldId = nodeCopy.id;
            let newId;
            if ("directory" in nodeCopy) {
                newId = nodeCopy["directory"].id + "/" + name;
            } else {
                newId = name;
            }
            changeSubtreeIds(nodeCopy, oldId, newId);
            let expandedKeysCopy = _.cloneDeep(treeExpandedKeys);
            for (let i = 0; i < expandedKeysCopy.length; i++) {
                if (
                    expandedKeysCopy[i].startsWith(oldId + "/") ||
                    expandedKeysCopy[i] === oldId
                ) {
                    expandedKeysCopy[i] =
                        nodeCopy.id + expandedKeysCopy[i].slice(oldId.length);
                }
            }

            // TODO: actually check the number of lib dirs
            let libraryDirs;
            if (!("directory" in node)) {
                libraryDirs = filesCopy.slice(0, 1);
                siblingList = filesCopy.slice(1);
            } else {
                libraryDirs = [];
                siblingList = nodeCopy.directory.children;
            }
            let fileIndex = siblingList.findIndex(o => {
                return !("children" in o);
            });
            if (fileIndex === -1) {
                fileIndex = filesCopy.length;
            }
            let dirArray = siblingList.slice(0, fileIndex);
            let fileArray = siblingList.slice(fileIndex);
            let nodeSort = (o1, o2) => {
                if (o1.name < o2.name) return -1;
                else if (o1.name > o2.name) return 1;
                else return 0;
            };
            if ("children" in node) {
                dirArray = dirArray.sort(nodeSort);
            } else {
                fileArray = fileArray.sort(nodeSort);
            }
            fileArray = dirArray.concat(fileArray);
            if (!("directory" in node)) {
                // TODO: actually check the number of lib dirs
                filesCopy = libraryDirs.concat(fileArray);
            } else {
                nodeCopy.directory.children = libraryDirs.concat(fileArray);
            }
            let newFilename = editorFilename;
            let newCursor = editorCursor;
            if (!_.isEmpty(editorCursor)) {
                let cursorMaybe = utils.getNodeFromPathList(
                    filesCopy,
                    utils.getNodePathList(editorCursor)
                );
                if (editorCursor.name !== cursorMaybe.name) {
                    newFilename = utils.getNodePathList(nodeCopy).join("/");
                    newCursor = nodeCopy;
                }
            }
            return { filesCopy, newFilename, newCursor, expandedKeysCopy };
        })
        .catch(error => {
            if (node.name === undefined) {
                if (siblingList.length === 1) {
                    nodeCopy.directory.empty = true;
                    nodeCopy.directory.children = consts.NO_CHILDREN;
                } else {
                    _.remove(siblingList, o => {
                        return _.isEqual(o, node);
                    });
                }
            } else {
                nodeCopy.untitled = false;
            }
            return error;
        });
}

export function saveProject(
    editorFilename,
    project,
    editorSceneInput,
    editorCode,
    access
) {
    return axios
        .post(
            consts.SAVE_URL,
            {
                // TODO: this should be a path list
                name: editorFilename,
                project: project,
                scene: editorSceneInput,
                code: editorCode,
                directory: false
            },
            { headers: getHeadersDict(access) }
        )
        .then(response => {
            return response;
        })
        .catch(error => {
            return error;
        });
}

export function checkRenderStatus(job_id) {
    return axios
        .get(consts.RENDER_URL + job_id)
        .then(response => {
            return response;
        })
        .catch(error => {
            return error;
        });
}

export function getFileContents(node, access) {
    return axios
        .post(
            consts.GET_FILES_URL,
            {
                project: node.project,
                pathList: node.id.split("/")
            },
            { headers: getHeadersDict(access) }
        )
        .then(response => {
            let displayingLibraryCode;
            if (node.directory !== undefined && node.directory["library"]) {
                displayingLibraryCode = true;
            }
            return { ...response, displayingLibraryCode };
        })
        .catch(error => {
            console.log(error);
            console.log(error.data);
        });
}

export function getDirectoryContents(node, access, editorFiles) {
    const pathList = node.id.split("/");

    return axios
        .post(
            consts.GET_FILES_URL,
            {
                project: node.project,
                pathList: pathList
            },
            { headers: getHeadersDict(access) }
        )
        .then(response => {
            let filesCopy = _.cloneDeep(editorFiles);
            let nodeCopy = utils.getNodeFromPathList(filesCopy, pathList);
            if (response.data.length !== 0) {
                let files = response.data.map(obj => {
                    if (obj.directory) {
                        let childrenNotLoaded = consts.CHILDREN_NOT_LOADED;
                        childrenNotLoaded[0]["id"] =
                            childrenNotLoaded[0]["name"];
                        obj["children"] = childrenNotLoaded;
                        obj["loading"] = true;
                        obj["directory"] = node;
                    } else {
                        obj["directory"] = node;
                    }
                    if (node["library"]) {
                        obj["library"] = true;
                        obj["readOnly"] = true;
                    }
                    obj["id"] = nodeCopy["id"] + "/" + obj["name"];
                    return obj;
                });
                nodeCopy["children"] = files;
            } else {
                nodeCopy["empty"] = true;
                let noChildren = consts.NO_CHILDREN;
                noChildren[0]["id"] = nodeCopy["id"] + "/" + noChildren["name"];
                nodeCopy["children"] = noChildren;
            }
            nodeCopy["loading"] = false;
            return filesCopy;
        })
        .catch(error => {
            console.log(error);
            console.log(error.data);
        });
}

export function postRender(
    editorFilenameInput,
    editorSceneInput,
    project,
    access
) {
    return axios
        .post(
            consts.RENDER_URL,
            {
                filename: editorFilenameInput,
                scene: editorSceneInput,
                project: project
            },
            { headers: getHeadersDict(access) }
        )
        .then(response => {
            if ("job_id" in response.data) {
                return response;
            }
        })
        .catch(error => {
            return error;
        });
}

export function fetchRestoreSession(access, editorFilename, project, logout) {
    return axios
        .post(
            consts.SESSION_URL,
            {
                name: editorFilename,
                project: project,
                directory: true
            },
            { headers: getHeadersDict(access) }
        )
        .then(response => {
            let files = response.data.files.map(obj => {
                if (obj.directory) {
                    delete obj.directory;
                    let childrenNotLoaded = consts.CHILDREN_NOT_LOADED;
                    childrenNotLoaded[0]["id"] = childrenNotLoaded[0]["name"];
                    obj["children"] = childrenNotLoaded;
                    obj["loading"] = true;
                } else {
                    delete obj.directory;
                }
                if (obj["library"]) {
                    obj["readOnly"] = true;
                }
                obj["id"] = obj["name"];
                return obj;
            });

            return { ...response, files };
        })
        .catch(error => {
            if (
                "response" in error &&
                error.response !== undefined &&
                "data" in error.response
            ) {
                let data = error.response.data;
                if (
                    error.response.status === 401 &&
                    data.code === "token_not_valid" &&
                    data.detail === "Given token not valid for any token type"
                ) {
                    alert(
                        "there was an error processing your token, " +
                            "please log in again"
                    );
                    logout();
                }
            }
            console.log(error.response);
        });
}

export function fetchUsernameFromToken(accessToken) {
    return axios
        .post(
            consts.USERNAME_URL,
            {
                access: accessToken,
            },
            { headers: getHeadersDict(accessToken) }
        )
        .then(response => {
            return { ...response };
        })
        .catch(error => {
            console.log(error);
            console.log(error.data);
        });
}
