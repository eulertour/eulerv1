import React from "react";
import closeIcon from "../assets/e-remove.svg";

export const DeleteModal = ({ handleModalClick, handleProjectDelete }) => {
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
            <div className="reset-modal">
                <div className="reset-confirmation-container">
                    <div className="reset-confirmation">
                        Are you sure you want to delete this project?
                    </div>
                </div>
                <div className="reset-buttons">
                    <div
                        className="banner-button danger-button"
                        onClick={handleProjectDelete}
                    >
                        Delete Project
                    </div>
                    <div
                        className="banner-button emphatic-button"
                        closeonclick="true"
                        onClick={handleModalClick}
                    >
                        Go Back
                    </div>
                </div>
            </div>
        </div>
    );
};
