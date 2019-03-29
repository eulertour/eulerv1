import React, { Component } from 'react';
import {Controlled as CodeMirror} from 'react-codemirror2';
import renderIcon from '../assets/icon-render@3x.svg';
import saveIcon from '../assets/icon-save@3x.svg';
// import settingsIcon from '../assets/icon-settings@3x.svg';
import TreeExample from '../components/tree.jsx';
import collapseTreeIcon from '../assets/icon-left@3x.svg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faEraser } from '@fortawesome/free-solid-svg-icons'
require('codemirror/lib/codemirror.css');
require('codemirror/theme/material.css');
require('codemirror/theme/neat.css');
require('codemirror/mode/xml/xml.js');
require('codemirror/mode/python/python.js');
require('codemirror/addon/scroll/simplescrollbars.js');
require('codemirror/addon/scroll/simplescrollbars.css');
require('./Editor.css');

library.add(faEraser);

class Editor extends Component {
    state = {
        menuOpen: false,
        treeCollapsed: false,
        gutterWidth: -1,
    }

    constructor(props, context) {
        super(props, context);
        this.getFileBanner=this.getFileBanner.bind(this);
        this.handleTreeToggle=this.handleTreeToggle.bind(this);
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
                    style={{width: this.state.gutterWidth + 'px'}}
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
                <div className="filename" key="filename">
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
        let projectEraseButton = (
            <FontAwesomeIcon
                className="file-banner-button eraser"
                icon={["fas", "eraser"]}
                onClick={this.props.onProjectReset}
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
                    {projectEraseButton}
                </div>
            </div>
        );
    }

    getRenderButton() {
        if (this.props.renderStatus === "") {
            return (
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
            );
        } else if (this.props.renderStatus === "request-sent") {
            return (
                <div
                    className="render-button"
                    onClick={this.props.onRenderCanceled}>
                    <img
                        className="render-icon"
                        src={renderIcon}
                        alt="render"
                    />
                    Request Sent...
                </div>
            );
        } else if (this.props.renderStatus === "queued") {
            return (
                <div
                    className="render-button"
                    onClick={this.props.onRenderCanceled}>
                    <img
                        className="render-icon"
                        src={renderIcon}
                        alt="render"
                    />
                    Queued...
                </div>
            );
        } else if (this.props.renderStatus === "started") {
            return (
                <div
                    className="render-button"
                    onClick={this.props.onRenderCanceled}>
                    <img
                        className="render-icon"
                        src={renderIcon}
                        alt="render"
                    />
                    Rendering...
                </div>
            );
        }
    }

    render() {
        return (
            <div className="manim-input">
                <div className="editor-container">
                    {this.state.treeCollapsed ? null :
                        <TreeExample
                            files={this.props.files}
                            cursor={this.props.cursor}
                            animating={this.props.animating}

                            onAnimationComplete={this.props.onAnimationComplete}
                            onFileDelete={this.props.onFileDelete}
                            onFileMove={this.props.onFileMove}
                            onFileRename={this.props.onFileRename}
                            onNewFile={this.props.onNewFile}
                            onNewFileName={this.props.onNewFileName}
                            onToggle={this.props.onToggle}
                            onTreeToggle={this.handleTreeToggle}

                            onTreeChange={this.props.onTreeChange}
                            onFileFetch={this.props.onFileFetch}
                            onDirFetch={this.props.onDirFetch}
                        />
                    }
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
                        {this.getRenderButton()}
                    </div>
                </div>
            </div>
        );
    }
}

export default Editor;
