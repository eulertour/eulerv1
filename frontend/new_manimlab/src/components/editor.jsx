import React, { Component } from 'react';
import {Controlled as CodeMirror} from 'react-codemirror2';
import renderIcon from '../assets/icon-render@3x.svg';
import saveIcon from '../assets/icon-save@3x.svg';
import settingsIcon from '../assets/icon-settings@3x.svg';
import TreeExample from '../components/tree.jsx';
require('codemirror/lib/codemirror.css');
require('codemirror/theme/material.css');
require('codemirror/theme/neat.css');
require('codemirror/mode/xml/xml.js');
require('codemirror/mode/python/python.js');
require('codemirror/addon/scroll/simplescrollbars.js');
require('codemirror/addon/scroll/simplescrollbars.css');


class Editor extends Component {
    state = {
        renaming: false,
        menuOpen: false,
    }

    constructor(props, context) {
        super(props, context);
        this.getFileBanner = this.getFileBanner.bind(this);
    }

    getFileBanner() {
        let filename;
        let renameButton;
        if (!this.state.renaming) {
            filename = (
                <div
                    className="filename"
                    key="filename"
                >{this.props.filename}</div>
            );
            renameButton = (
                <button
                    className="file-banner-button rename-button"
                    key="rename"
                    onClick={() => {
                        this.setState({renaming: true});
                    }}
                >rename</button>
            );
        } else {
            filename = (
                <input
                    className="file-banner-button filename-input"
                    key="filename"
                    type="text"
                    value={this.props.filename}
                    onChange={this.props.onFilenameChange}
                />
            );
            renameButton = (
                <button
                    className="file-banner-button file-rename"
                    key="rename"
                    onClick={() => {
                        this.setState({
                            renaming: false,
                        });
                    }}
                >finish</button>
            );
        }
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
                    {renameButton}
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
                    <div className="tree-part">
                        <TreeExample
                            files={this.props.files}
                            cursor={this.props.cursor}
                            onExpandDirectory={this.props.onExpandDirectory}
                            onSelectNode={this.props.onSelectNode}
                            onDoubleClick={this.props.onDoubleClick}
                        />
                    </div>
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
