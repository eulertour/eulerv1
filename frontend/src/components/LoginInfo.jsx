import React from "react";
import anonymousUser from "../assets/icon-name-active@3x.svg";
import fileImage from "../assets/icon-file@3x.svg";
import { NavLink } from "react-router-dom";
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

export const LoginInfo = withStyles((theme) => ({
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
    },
    emphaticButton: {
        backgroundColor: "#b43daf",
        color: "white",
        border: "none",
        '&:hover': {
            backgroundColor: "#8c3087",
        }
    },
    filesButton: {
        display: "none",
    },
    logoutButton: {
        '&:hover': {
            backgroundColor: "#e5e5e5",
        }
    },
    fileImage: {
      marginRight: "5px",
      height: "13px",
    },
    userImageBackground: {
      height: "37px",
      width: "37px",
      border: "1px solid #dcdcdc",
      borderRadius: "50%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      marginRight: "15px",
    },
    userImage: {
      height: "20px",
      marginBottom: "1px",
    },
    loginButton: {
        color: "#0e0e0e",
        marginRight: "0",
        '&:hover': {
            backgroundColor: "#e5e5e5",
        }
    },
    accountInfo: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    username: {
      fontWeight: "700",
      marginRight: "14px",
    },
    login: {
      marginRight: "8px",
    },
    colorBlack: {
      color: "black",
    }
}))(({ username, logOut, from, classes }) => {
    return (
        <div className={classes.accountInfo}>
            {username.length !== 0 ? (
                <>
                    <div
                        className={classNames(
                        classes.bannerButton,
                        classes.emphaticButton,
                        classes.filesButton)}
                    >
                        <img
                            className={classes.fileImage}
                            src={fileImage}
                            alt="file"
                        />
                        Your Files
                    </div>
                    <div
                        className={classNames(
                        classes.bannerButton,
                        classes.logoutButton,
                        classes.colorBlack)}
                        onClick={logOut}
                    >
                        Log Out
                    </div>
                    <div
                        className={classNames(
                        classes.username,
                        classes.colorBlack)}
                    >{username}</div>
                    <div className={classes.userImageBackground}>
                        <img
                            className={classes.userImage}
                            src={anonymousUser}
                            alt="user"
                        />
                    </div>
                </>
            ) : (
                <>
                    <NavLink
                        to={{
                            pathname: "/login",
                            state: { from: from }
                        }}
                        className={classes.login}
                    >
                        <div
                            className={classNames(
                            classes.bannerButton,
                            classes.loginButton)}
                        >Log In</div>
                    </NavLink>
                    <NavLink
                        to={{
                            pathname: "/signup",
                            state: { from: from }
                        }}
                        style={{color: "white"}}
                    >
                        <div
                            className={classNames(
                            classes.bannerButton,
                            classes.emphaticButton)}
                        >
                            Sign Up
                        </div>
                    </NavLink>
                </>
            )}
        </div>
    );
});
