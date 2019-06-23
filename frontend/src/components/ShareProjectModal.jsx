import React from "react";
import closeIcon from "../assets/e-remove.svg";
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

export const ShareProjectModal = withStyles((theme) => ({
    modalBackground: {
        position: 'fixed',
        /* Stay in place */
        zIndex: theme.zIndex.modal,
        /* Sit on top */
        left: '0',
        top: '0',
        width: '100%',
        /* Full width */
        height: '100%',
        /* Full height */
        overflow: 'auto',
        /* Fallback color */
        backgroundColor: 'rgba(240, 240, 240, .6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    namingModal: {
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: "0 2px 10px 0 rgba(0, 0, 0, 0.21)",
        backgroundColor: "white",
        height: "240px",
        width: "400px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
    },
    resetButtons: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "12px",
    },
    bannerButton: {
        borderRadius: "8px",
        width: "105px",
        height: "37px",
        display: "flex",
        fontSize: "12px",
        marginRight: "14px",
        border: "1px solid #dcdcdc",
        justifyContent: "center",
        alignItems: "center",
        boxSizing: "border-box",
        cursor: "pointer",
        transition: "background-color 0.3s ease-in-out",
        '&:hover': {
          backgroundColor: "#e5e5e5",
        }
    },
    emphaticButton: {
      backgroundColor: "#b43daf",
      color: "white",
      border: "none",
      '&:hover': {
        backgroundColor: "#8c3087",
      }
    },
    dangerButton: {
      backgroundColor: "#dc0505",
      color: "white",
      border: "none",
      '&:hover': {
        backgroundColor: "#a90303",
      }
    },
    loginInput: {
      backgroundColor: "inherit",
      borderRadius: "5px",
      border: "1px solid #DCDCDC",
      height: "40px",
      width: "80%",
      padding: "8px",
      fontSize: "18px",
    },
    namePrompt: {
      fontSize: "16px",
      marginBottom: "20px",
    },
}))(({ onModalClick, onShareProject, shareName, onShareNameChange, shared, classes }) => {
    return (
        <div
            className={classes.modalBackground}
            closeonclick="true"
            onClick={onModalClick}
        >
            <img
                className="close-icon"
                src={closeIcon}
                alt="close"
                closeonclick="true"
            />
            <div className={classes.namingModal}>
                <div className={classes.namePrompt}>
                    What would you like to name this project?
                </div>
                <input
                    className={classes.loginInput}
                    type="text"
                    placeholder="Project name"
                    value={shareName}
                    onChange={onShareNameChange}
                />
                <div className={classes.resetButtons}>
                    <div
                        className={classNames(classes.bannerButton, classes.emphaticButton)}
                        onClick={onShareProject}
                    >
                        {shared ? "Clone" : "Share"} Project
                    </div>
                    <div
                        className={classNames(classes.bannerButton)}
                        closeonclick="true"
                        onClick={onModalClick}
                    >
                        Go Back
                    </div>
                </div>
            </div>
        </div>
    );
});
