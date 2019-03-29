export const getNodePathList = (node) => {
    let currentNode = node;
    let dirs = [currentNode.name];
    while ('directory' in currentNode) {
        currentNode = currentNode.directory;
        dirs.push(currentNode.name);
    }
    return dirs.reverse();
};

export const getNodeFromPathList = (rootList, pathList) => {
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
};
