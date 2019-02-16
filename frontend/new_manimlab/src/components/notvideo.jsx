import React, { Component } from 'react';
import { Player } from 'video-react';
import "../../node_modules/video-react/dist/video-react.css";
import * as consts from '../constants.js';
import playButton from '../assets/button-circle-play@3x.svg';
import 'react-perfect-scrollbar/dist/css/styles.css';
import PerfectScrollbar from 'react-perfect-scrollbar'

class NotVideo extends Component {
    state = {}

    getVideoURL(user, project, file, scene) {
        return 'http://eulertour.com:9000/user/' + user + '/projects/' +
            project + '/videos/project/source/' + file.split('.')[0] + '/480p15/' +
            scene + '.mp4';
    }

    render() {
        let title = <div className="title">{this.props.scene}</div>;
        let video;
        let delimiter;
        if (this.props.returncode !== 0 ||
            this.props.scene === consts.DEFAULT_SELECTED_SCENE) {
            delimiter = '\n';
            video = <div className="video-placeholder">
                        <img
                            className="play-button"
                            src={playButton}
                            alt="play button"
                        />
                    </div>;
        } else {
            delimiter = '\r';
            let url = this.getVideoURL(
                this.props.username,
                this.props.project,
                this.props.filename,
                this.props.scene,
            )
            video = <Player
                        playsInline
                        src={url}
                        fluid={false}
                        height={"calc(100% - 180px)"}
                    />;
        }
        let logs = (
            <div className="logs-container">
            <div className="manim-logs">
            <PerfectScrollbar option={{wheelPropagation: false}} >
                {this.props.error
                    .split(delimiter)
                    .map((item, i) => {
                        if (item.startsWith("Animation")) {
                            let colonIndex = item.indexOf(':');
                            let animationNumber =
                                item.substring(0, colonIndex + 1);
                            let rest = item.substring(colonIndex + 1);
                            colonIndex = rest.indexOf(':');
                            let animationName =
                                rest.substring(0, colonIndex + 1);
                            rest = rest.substring(colonIndex + 1);
                            return (
                                <p key={i}>
                                    <span className="animation-number">{animationNumber}</span>
                                    <span className="animation-name">{animationName}</span>
                                    <span className="animation-progress">{rest}</span>
                                </p>
                            );
                        } else {
                            return <p key={i}>{item}</p>;
                        }
                })}
            </PerfectScrollbar>
            </div>
            </div>
        );
        return (
          <div className="manim-output">
              {title}
              {video}
              {logs}
          </div>
        );
    }
}

export default NotVideo;
