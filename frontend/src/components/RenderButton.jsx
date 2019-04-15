import React from "react";
import renderIcon from "../assets/icon-render@3x.svg";

export const RenderButton = ({ renderStatus, onRenderCanceled, onRender }) => {
    if (renderStatus === "") {
        return (
            <div className="render-button" onClick={onRender}>
                <img className="render-icon" src={renderIcon} alt="render" />
                Render Scene
            </div>
        );
    } else if (renderStatus === "request-sent") {
        return (
            <div className="render-button" onClick={onRenderCanceled}>
                <img className="render-icon" src={renderIcon} alt="render" />
                Request Sent...
            </div>
        );
    } else if (renderStatus === "queued") {
        return (
            <div className="render-button" onClick={onRenderCanceled}>
                <img className="render-icon" src={renderIcon} alt="render" />
                Queued...
            </div>
        );
    } else if (renderStatus === "started") {
        return (
            <div className="render-button" onClick={onRenderCanceled}>
                <img className="render-icon" src={renderIcon} alt="render" />
                Rendering...
            </div>
        );
    }
};
