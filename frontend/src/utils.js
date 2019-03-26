export const getNodePathList = (node) => {
    let currentNode = node;
    let dirs = [currentNode.name];
    while ('directory' in currentNode) {
        currentNode = currentNode.directory;
        dirs.push(currentNode.name);
    }
    return dirs.reverse();
};

