import User from "../models/User";
import fetch from "node-fetch";
import bcrypt from "bcryptjs/dist/bcrypt";

export const getJoin = (req, res) => res.render("users/join", { pageTitle: "Create Account" });
export const postJoin = async (req, res) => {
    const { name, username, email, password, password2, location } = req.body;
    const pageTitle = "Join";
    if (password !== password2) {
        return res.status(400).render("users/join", {
            pageTitle,
            errorMessage: "Password confirmation does not match.",
        });
    }

    const exists = await User.exists({ $or: [{ username }, { email }] });
    if (exists) {
        return res.status(400).render("users/join", {
            pageTitle,
            errorMessage: "This username/email is already taken.",
        });
    }
    try {
        await User.create({
            name,
            username,
            email,
            password,
            location,
        });
        return res.redirect("/login");
    } catch (error) {
        return res.status(400).render("users/join", {
            pageTitle: "Join",
            errorMessage: error._message,
        });
    }
};
export const getLogin = (req, res) => res.render("users/login", { pageTitle: "Login" });

export const postLogin = async (req, res) => {
    const { username, password } = req.body;
    const pageTitle = "Login";
    // Check if account exists
    const user = await User.findOne({ username, snsLogin: false });
    if (!user) {
        return res.status(400).render("users/login", {
            pageTitle,
            errorMessage: "An account with this username does not exists."
        });
    }

    // Check if password correct
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(400).render("users/login", {
            pageTitle,
            errorMessage: "Wrong password",
        });
    }

    // Log User IN!
    // -- Adding info to session
    req.session.loggedIn = true;
    req.session.user = user;

    return res.redirect("/");
}

export const startGithubLogin = (req, res) => {
    const baseUrl = "https://github.com/login/oauth/authorize";
    const config = {
        client_id: process.env.GITHUB_CLIENTID,
        allow_signup: true,
        scope: "read:user user:email",
    };
    const params = new URLSearchParams(config).toString();
    const url = `${baseUrl}?${params}`;
    return res.redirect(url);
}

export const callbackGithubLogin = async (req, res) => {
    const baseUrl = "https://github.com/login/oauth/access_token";
    const config = {
        client_id: process.env.GITHUB_CLIENTID,
        client_secret: process.env.GITHUB_SECRET,
        code: req.query.code,
    };
    const params = new URLSearchParams(config).toString();
    const url = `${baseUrl}?${params}`;
    const tokenRequest = await (await fetch(url, {
        method: "POST",
        headers: { Accept: "application/json", },
    })).json();

    if ("access_token" in tokenRequest) {
        // Access api
        const { access_token } = tokenRequest;
        const apiUrl = "https://api.github.com";
        // Read user
        const userData = await (
            await fetch(`${apiUrl}/user`, {
                headers: {
                    Authorization: `token ${access_token}`,
                },
            })
        ).json();
        console.log(userData);
        // Read user private email
        const emailData = await (
            await fetch(`${apiUrl}/user/emails`, {
                headers: {
                    Authorization: `token ${access_token}`,
                },
            })
        ).json();
        const emailObj = emailData.find(
            (email) => email.primary === true && email.verified === true
        );
        if (!emailObj) {
            // No verified emails in Github <- set notification
            return res.redirect("/login");
        }
        // (Case) Github email == Already Joined email
        // -> Verified, so let the user in
        let user = await User.findOne({ email: emailObj.email });
        if (!user) {
            // Create an account with Github infos
            user = await User.create({
                avatarUrl: userData.avatar_url,
                name: userData.name,
                username: userData.login,
                email: emailObj.email,
                password: "",
                snsLogin: true,
                location: userData.location,
            });
        }
        // Log User in
        req.session.loggedIn = true;
        req.session.user = user;
        return res.redirect("/");
    }
    else {
        // Send notification and redirect
        return res.redirect("/login");
    }
}

export const logout = (req, res) => {
    req.session.destroy();
    return res.redirect("/");
};


export const getEdit = (req, res) => {
    return res.render("users/edit-profile", { pageTitle: "Edit Profile" });
}

export const postEdit = async (req, res) => {
    const {
        session: {
            user: { _id, avatarUrl },
        },
        body: { email, username, location },
        file,
    } = req;

    // Check updated values Available
    const exists = await User.exists({ $and: [{ "_id": { $ne: _id } }, { $or: [{ username }, { email }] }] });
    if (exists) {
        return res.status(400).render("users/edit-profile", {
            pageTitle: "Edit Profile",
            errorMessage: "This username/email is already taken.",
        });
    }

    const updatedUser = await User.findByIdAndUpdate(_id, {
        avatarUrl: file ? file.path : avatarUrl, email, username, location,
    }, { new: true });

    // Update new Update
    req.session.user = updatedUser;

    return res.redirect("/");
}

export const getChangePassword = (req, res) => {
    if (req.session.user.snsLogin === true) {
        req.flash("error", "Can't change password for Github Users");
        return res.redirect("/");
    }
    return res.render("users/change-password", { pageTitle: "Change Password" });
}

export const postChangePassword = async (req, res) => {
    const {
        session: {
            user: { _id, password },
        },
        body: { oldPassword, newPassword, newPasswordConfirm },
    } = req;

    // Compare oldPassword == current pw
    const match = await bcrypt.compare(oldPassword, password);
    if (!match) {
        return res.status(400).render("users/change-password", {
            pageTitle: "Change Password",
            errorMessage: "Current password is incorrect"
        });
    }

    // Compare newPassword == pw confirmation
    if (newPassword !== newPasswordConfirm) {
        return res.status(400).render("users/change-password", {
            pageTitle: "Change Password",
            errorMessage: "Password Confirmation does not match"
        });
    }

    // OldPassword different from newPassword
    if (oldPassword == newPassword) {
        return res.status(400).render("users/change-password", {
            pageTitle: "Change Password",
            errorMessage: "New Password should be different from the old"
        });
    }

    // Encrypt & Update the password
    const user = await User.findById(_id);
    user.password = newPassword;
    await user.save();
    req.flash("info", "Password Updated");
    req.session.user.password = user.password;

    // Send notification - changed password!

    return res.redirect("/users/logout");
}

export const deleteUser = (req, res) => res.send("Delete user");

export const profile = async (req, res) => {
    const { id } = req.params;
    // Populate : Get whole object "owner" by mongoose ref model
    const user = await User.findById(id).populate({
        path: "videos",
        populate: {
            path: "owner",
            model: "User",
        },
    });

    if (!user) {
        return res.status(404).render("404", { pageTitle: "NOT FOUND" });
    }
    console.log(user);

    return res.render("profile", { pageTitle: `${user.name}님의 Profile`, user });
} 