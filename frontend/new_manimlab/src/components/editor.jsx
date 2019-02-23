import React, { Component } from 'react';
import {Controlled as CodeMirror} from 'react-codemirror2';
import renderIcon from '../assets/icon-render@3x.svg';
import saveIcon from '../assets/icon-save@3x.svg';
import settingsIcon from '../assets/icon-settings@3x.svg';
import TreeExample from '../components/tree.jsx';
import collapseTreeIcon from '../assets/icon-left@3x.svg';
import * as consts from '../constants.js';
require('codemirror/lib/codemirror.css');
require('codemirror/theme/material.css');
require('codemirror/theme/neat.css');
require('codemirror/mode/xml/xml.js');
require('codemirror/mode/python/python.js');
require('codemirror/addon/scroll/simplescrollbars.js');
require('codemirror/addon/scroll/simplescrollbars.css');


class Editor extends Component {
    state = {
        menuOpen: false,
        treeCollapsed: false,
        gutterWidth: -1,
    }

    constructor(props, context) {
        super(props, context);
        this.getFileBanner = this.getFileBanner.bind(this);
        this.handleTreeToggle = this.handleTreeToggle.bind(this);
    }

    componentDidUpdate() {
        // a hack to make sure the expand button and gutter have equal width
        let gutter = document.getElementsByClassName("CodeMirror-gutter CodeMirror-linenumbers")[0];
        let gutterWidth = window.getComputedStyle(gutter).width;
        gutterWidth = gutterWidth.slice(0, gutterWidth.length - 2);
        gutterWidth = Math.round(parseFloat(gutterWidth));
        if (gutterWidth !== this.state.gutterWidth) {
            this.setState({gutterWidth: gutterWidth});
        }
    }

    handleTreeToggle() {
        this.setState({treeCollapsed: !this.state.treeCollapsed});
    }

    getFileBanner() {
        let collapseArrow = null;
        let filename;
        if (this.state.treeCollapsed) {
            collapseArrow = (
                <div
                    style={{
                        width: this.state.gutterWidth + 'px',
                    }}
                    className="expand-button"
                    onClick={this.handleTreeToggle}
                >
                    <img
                        className="expand-icon reverse"
                        src={collapseTreeIcon}
                        alt="collapse tree"
                    />
                </div>
            )
        }
        filename = (
            <div className="arrow-and-filename">
                {collapseArrow}
                <div
                    className="filename"
                    key="filename"
                >
                    {this.props.filename}
                </div>
            </div>
        );
        let saveButton = (
            <img
                className="file-banner-button"
                src={saveIcon}
                alt="save"
                onClick={this.props.onSave}
            />
        );
        let settingsButton = (
            <img
                className="file-banner-button"
                src={settingsIcon}
                alt="settings"
            />
        );
        return (
            <div className="filename-container">
                {filename}
                <div className="editor-buttons">
                    <div className="save-message-container">
                        {this.props.saveMessage}
                    </div>
                    {saveButton}
                    {settingsButton}
                </div>
            </div>
        );
    }

    render() {
        return (
            <div className="manim-input">
                <div className="editor-container">
                    <TreeExample
                        files={this.props.files}
                        cursor={this.props.cursor}
                        collapsed={this.state.treeCollapsed}
                        newFileName={this.props.newFileName}
                        namingNewFile={this.props.namingNewFile}

                        onExpandDirectory={this.props.onExpandDirectory}
                        onSelectNode={this.props.onSelectNode}
                        onTreeToggle={this.handleTreeToggle}
                        onNewFile={this.props.onNewFile}
                        onNewDirectory={this.props.onNewDirectory}
                        onToggle={this.props.onToggle}
                        onDirectoryName={this.props.onDirectoryName}
                        onFileName={this.props.onFileName}
                        onNewFileNameChange={this.props.onNewFileNameChange}
                        onFileRename={this.props.onFileRename}
                        onFileMove={this.props.onFileMove}
                        onFileDelete={this.props.onFileDelete}
                    />
                    <div className="editor-part">
                        {this.getFileBanner()}
                        <CodeMirror
                            value={this.props.code}
                            options={{
                                mode: 'python',
                                theme: 'default',
                                lineNumbers: true,
                                viewportMargin: 30,
                                scrollbarStyle: 'overlay',
                                readOnly: this.props.readOnly,
                            }}
                            onBeforeChange={(editor, data, value) => {
                                this.props.onCodeChange(value);
                            }}
                            onChange={(editor, data, value) => {
                                // only autosave after typing, not changing
                                // files
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
                            value={this.props.inputFilename}
                            onChange={this.props.onInputFilenameChange}
                        />
                        <input
                            className="scene-text-input"
                            type="text"
                            placeholder="select Scene"
                            spellCheck="false"
                            value={this.props.scene}
                            onChange={this.props.onSceneChange}
                        />
                        <div
                            className="render-button"
                            onClick={this.props.onRender}>
                            <img
                                className="render-icon"
                                src={renderIcon}
                                alt="render"
                            />
                            Render Scene
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Editor;
