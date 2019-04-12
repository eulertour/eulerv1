import React from "react";
import anonymousUser from "../assets/icon-name-active@3x.svg";
import fileImage from "../assets/icon-file@3x.svg";
import { NavLink } from "react-router-dom";

export const LoginInfo = ({ username, logOut }) => {
    return (
        <div className="account-info">
            {username.length !== 0 ? (
                <>
                    <div className="banner-button emphatic-button files-button">
                        <img
                            className="file-image"
                            src={fileImage}
                            alt="file"
                        />
                        Your Files
                    </div>
                    <div
                        className="banner-button logout-button"
                        onClick={logOut}
                    >
                        Log Out
                    </div>
                    <div className="username">{username}</div>
                    <div className="user-image-background">
                        <img
                            className="user-image"
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
                            state: { from: "/" }
                        }}
                        className="login"
                    >
                        <div className="banner-button login-button">Log In</div>
                    </NavLink>
                    <NavLink
                        to={{
                            pathname: "/signup",
                            state: { from: "/" }
                        }}
                        id="signup-button"
                    >
                        <div className="banner-button emphatic-button">
                            Sign Up
                        </div>
                    </NavLink>
                </>
            )}
        </div>
    );
};
