import React, { Component } from 'react';
import { Player, ControlBar } from 'video-react';
import "../../node_modules/video-react/dist/video-react.css";
import * as consts from '../constants.js';
import playButton from '../assets/button-circle-play@3x.svg';
import 'react-perfect-scrollbar/dist/css/styles.css';
import PerfectScrollbar from 'react-perfect-scrollbar';
import NotDownloadButton from './NotDownloadButton';

class NotVideo extends Component {
    state = {
        version: 0,
        reload: false,
    }

    getVideoURL(access, version, mediaPath) {
        let url = consts.MEDIA_URL + mediaPath + '?v=' + version;
        if (access.length > 0) {
            url += '&jwt=' + access;
        }
        return url;
    }

    componentWillReceiveProps(props) {
        const { reload } = this.props;
        if (props.reload !== reload) {
            this.setState({version: this.state.version + 1});
        }
    }

    render() {
        let title = <div className="title">{this.props.scene}</div>;
        let video_content;
        let delimiter;
        if (this.props.returncode !== 0 ||
            this.props.scene === "") {
            delimiter = '\n';
            video_content = (
                <div className="video-placeholder">
                    <img
                        className="play-button"
                        src={playButton}
                        alt="play button"
                    />
                </div>
            );
        } else {
            delimiter = '\r';
            let url = this.getVideoURL(
                this.props.access,
                this.state.version,
                this.props.mediaPath,
            )
            video_content = (
                <Player
                    playsInline
                    src={url}
                    fluid={false}
                    height={"100%"}
                >
                    <ControlBar autoHide={false}>
                        <NotDownloadButton order={7}/>
                    </ControlBar>
                </Player>
            );
        }
        let video = (
            <div className="video-container">
                {video_content}
            </div>
        );
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
