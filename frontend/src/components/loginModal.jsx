import React from "react";

import closeIcon from "../assets/e-remove.svg";
import Login from "./login.jsx";

export const LoginModal = ({ handleModalClick, loginSuccess }) => {
    return (
        <div
            className="modal-background"
            closeonclick="true"
            onClick={handleModalClick}
        >
            <img
                className="close-icon"
                src={closeIcon}
                alt="close"
                closeonclick="true"
            />
            <Login
                controlUrl={false}
                onAuth={response => loginSuccess(response)}
            />
        </div>
    );
};
