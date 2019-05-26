import React from "react";
import bigLogo from "../assets/eulertour_logo.png";
import { withStyles } from '@material-ui/core/styles';
import hypercube from "../assets/banner/hypercube.mp4";
import sum from "../assets/banner/sum.png";
import euler from "../assets/banner/euler.png";
import imaginary from "../assets/banner/imaginary.png";
import omega from "../assets/banner/omega.png";
import pi from "../assets/banner/pi.png";
import integers from "../assets/banner/integers.png";
import integral from "../assets/banner/integral.png";
import phi from "../assets/banner/phi.png";
import infinity from "../assets/banner/infinity.png";
import square from "../assets/banner/square.png";
import circle from "../assets/banner/circle.png";
import triangle from "../assets/banner/triangle.png";
import { Stage, Layer, Rect, Text } from 'react-konva';
import Konva from 'konva';

import * as colors from '@material-ui/core/colors';

const canvasHeight = 500;
const logoHeight = 0.5 * canvasHeight;
const driftRate = 0.007;
const videoPlaybackRate = 0.4;
const styles = theme => ({
    canvasSpacer: {
        height: canvasHeight,
    },
    canvas: {
        position: "absolute",
    },
    canvasContent: {
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%", 
        height: canvasHeight,
    },
    hypercube: {
        height: logoHeight,
        width: logoHeight,
    },
    bannerText: {
        fontWeight: "bold",
        fontSize: "3rem",
        fontFamily: "sans-serif",
        letterSpacing: -1,
    },
    sum: {
        filter: "opacity(0.5) drop-shadow(0 0 0 blue)",
    }
});

class Banner extends React.Component {
    constructor(props) {
        super(props);
        this.square = React.createRef();
        this.layer = React.createRef();
        this.video = React.createRef();
        this.state = {
            x: 0,
            y: 0,
        };
    }

    placeImage = (source, x, y, size, color) => {
        let imageObj = new Image();
        imageObj.src = source;
        imageObj.onload = () => {
            let img = new Konva.Image({image: imageObj});
            let height_width_ratio = img.height() / img.width();
            img.width(40 * size);
            img.height(40 * height_width_ratio * size);
            img.position({x: x * window.innerWidth, y: y * canvasHeight});
            img.cache();
            img.filters([Konva.Filters.RGB]);
            let regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
            img.red(parseInt(regex[1], 16));
            img.green(parseInt(regex[2], 16));
            img.blue(parseInt(regex[3], 16));
            this.layer.current.add(img);

            let anim = new Konva.Animation((frame) => {
              let timeDiff = frame.timeDiff;
                if (img.y() > canvasHeight) {
                    img.position({x: img.x(), y: -img.height()});
                } else {
                    img.move({y: timeDiff * driftRate});
                }
            }, this.layer.current);
            anim.start();
        };
    }

    componentDidMount = () => {
        var video = this.video.current;
        video.playbackRate = videoPlaybackRate;
        this.placeImage(circle  , 0.07, 0.05, 0.9, colors.pink[500]);
        this.placeImage(sum     , 0.25, 0.23, 1.8, colors.orange[500]);
        this.placeImage(pi      , 0.63, 0.3 , 0.9, colors.purple[500]);
        this.placeImage(integers, 0.13, 0.40, 0.6, colors.green[500]);
        this.placeImage(euler   , 0.65, 0.78, 1.6, colors.green[500]);

        this.placeImage(phi     , 0.84, 0.21, 1.2, colors.red[500]);
        this.placeImage(square  , 0.71, 1   , 0.8, colors.indigo[500]);
        this.placeImage(infinity, 0.04, 0.8 , 1.2, colors.cyan[500]);
        this.placeImage(triangle, 0.27, 0.88, 1.5, colors.blue[500]);
        this.placeImage(integral, 0.90, 0.43, 0.8, colors.lightBlue[500]);
    }

    render() {
        const { classes } = this.props;
        return (
            <React.Fragment>
                <div className={classes.canvasContainer}>
                    <Stage
                        width={window.innerWidth}
                        height={canvasHeight}
                        style={{position: 'absolute'}} 
                    >
                        <Layer ref={this.layer} />
                    </Stage>
                    <div className={classes.canvasContent}>
                        <video
                            className={classes.hypercube}
                            src={hypercube}
                            loop
                            autoPlay
                            type="video/mp4"
                            ref={this.video}
                        />
                        <div className={classes.bannerText}>
                            An online editor for Manim
                        </div>
                    </div>
                    <div className={classes.canvasSpacer} />
                </div>
            </React.Fragment>
        );
    }
};

export default withStyles(styles, { withTheme: true })(Banner);
