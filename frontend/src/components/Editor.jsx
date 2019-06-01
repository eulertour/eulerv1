import React, { Component } from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import saveIcon from "../assets/icon-save@3x.svg";
import TreeExample from "./Tree.jsx";
import { SettingsMenu } from "./SettingsMenu.jsx";
import collapseTreeIcon from "../assets/icon-left@3x.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faEraser } from "@fortawesome/free-solid-svg-icons";
import { RenderButton } from "./RenderButton";
import { Tooltip } from "@material-ui/core";
import { withStyles } from '@material-ui/core/styles';
import SettingsIcon from '@material-ui/icons/Settings';
import grey from '@material-ui/core/colors/grey';
require("codemirror/lib/codemirror.css");
require("codemirror/theme/material.css");
require("codemirror/theme/neat.css");
require("codemirror/mode/xml/xml.js");
require("codemirror/mode/python/python.js");
require("codemirror/addon/scroll/simplescrollbars.js");
require("codemirror/addon/scroll/simplescrollbars.css");
require("./Editor.css");

library.add(faEraser);

const styles = theme => ({
    settingsButton: {
        backgroundColor: "#b43daf",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        borderRightWidth: 1,
        borderRightStyle: "solid",
        borderRightColor: grey[400],
        padding: "0 2px",
        '&:hover': {
            backgroundColor: "#8c3087",
        }
    },
    settingsIcon: {
        color: theme.palette.common.white,
        fontSize: "1.3em",
    }
});

class Editor extends Component {
    state = {
        menuOpen: false,
        treeCollapsed: false,
        gutterWidth: -1,
    };


    componentDidUpdate() {
        // a hack to make sure the expand button and gutter have equal width
        let gutter = document.getElementsByClassName(
            "CodeMirror-gutter CodeMirror-linenumbers"
        )[0];
        let gutterWidth = window.getComputedStyle(gutter).width;
        gutterWidth = gutterWidth.slice(0, gutterWidth.length - 2);
        gutterWidth = Math.round(parseFloat(gutterWidth));
        if (gutterWidth !== this.state.gutterWidth) {
            this.setState({ gutterWidth: gutterWidth });
        }
    }

    handleTreeToggle = () => {
        this.setState({ treeCollapsed: !this.state.treeCollapsed });
    };

    getFileBanner = () => {
        let collapseArrow = null;
        let filename;
        if (this.state.treeCollapsed) {
            collapseArrow = (
                <div
                    style={{ width: this.state.gutterWidth + "px" }}
                    className="expand-button"
                    onClick={this.handleTreeToggle}
                >
                    <img
                        className="expand-icon reverse"
                        src={collapseTreeIcon}
                        alt="collapse tree"
                    />
                </div>
            );
        }
        filename = (
            <div className="arrow-and-filename">
                {collapseArrow}
                <div className="filename" key="filename">
                    {this.props.filename}
                </div>
            </div>
        );
        let saveButton = (
            <Tooltip title="Save File" placement="top">
                <img
                    className="file-banner-button"
                    src={saveIcon}
                    alt="save"
                    onClick={this.props.onSave}
                />
            </Tooltip>
        );
        let projectEraseButton = (
            <Tooltip title="Erase Project" placement="top">
                <FontAwesomeIcon
                    className="file-banner-button eraser"
                    icon={["fas", "eraser"]}
                    onClick={this.props.onProjectReset}
                />
            </Tooltip>
        );
        return (
            <div className="filename-container">
                {filename}
                <div className="editor-buttons">
                    <div className="save-message-container">
                        {this.props.saveMessage}
                    </div>
                    {saveButton}
                    {projectEraseButton}
                </div>
            </div>
        );
    };

    render() {
        const { classes } = this.props;
        return (
            <div className="manim-input">
                <div className="editor-container">
                    <TreeExample
                        treeCollapsed={this.state.treeCollapsed}
                        files={this.props.files}
                        cursor={this.props.cursor}
                        animating={this.props.animating}
                        expandedKeys={this.props.expandedKeys}
                        onAnimationComplete={this.props.onAnimationComplete}
                        onFileDelete={this.props.onFileDelete}
                        onFileMove={this.props.onFileMove}
                        onFileRename={this.props.onFileRename}
                        onNewFile={this.props.onNewFile}
                        onNewFileName={this.props.onNewFileName}
                        onToggle={this.props.onToggle}
                        onTreeToggle={this.handleTreeToggle}
                        onTreeChange={this.props.onTreeChange}
                        onTreeExpand={this.props.onTreeExpand}
                        onFileFetch={this.props.onFileFetch}
                        onDirFetch={this.props.onDirFetch}
                    />
                    <div className="editor-part">
                        {this.getFileBanner()}
                        <CodeMirror
                            value={this.props.code}
                            options={{
                                mode: "python",
                                theme: "default",
                                lineNumbers: true,
                                viewportMargin: 30,
                                scrollbarStyle: "overlay",
                                readOnly: this.props.readOnly
                            }}
                            onBeforeChange={(editor, data, value) => {
                                this.props.onCodeChange(value);
                            }}
                            onChange={(editor, data, value) => {
                                // don't autosave after changing files
                                if (data.origin !== undefined) {
                                    this.props.onSetAutosaveTimeout();
                                }
                            }}
                        />
                    </div>
                </div>
                <div className="scene-container">
                    <div className="scene-inputs">
                        <input
                            className="file-text-input"
                            type="text"
                            placeholder="select file"
                            spellCheck="false"
                            value={this.props.filenameInput}
                            onChange={this.props.onInputFilenameChange}
                        />
                        <input
                            className="scene-text-input"
                            type="text"
                            placeholder="select Scene"
                            spellCheck="false"
                            value={this.props.sceneInput}
                            onChange={this.props.onInputSceneChange}
                        />
                        <SettingsMenu
                            resolution={this.props.resolution}
                            onResolutionChange={this.props.onResolutionChange}
                        />
                        <RenderButton
                            onRender={this.props.onRender}
                            renderStatus={this.props.renderStatus}
                            onRenderCanceled={this.props.onRenderCanceled}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default withStyles(styles, { withTheme: true })(Editor);
