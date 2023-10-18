import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import {v2 as cloudinary} from "cloudinary";
import mongoose from "mongoose";

//signup user
const signupUser = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    const user = await User.findOne({ $or: [{ email }, { username }] });

    if (user) {
      return res.status(400).json({ error: "user already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      username,
      password: hashedPassword,
    });
    await newUser.save();

    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);
      res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        bio: newUser.bio,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid User Data !" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in signupUser:", error.message);
  }
};

//login user
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    );

    if (!user || !isPasswordCorrect)
      return res.status(400).json({ error: "Invalid Username or Password" });

    generateTokenAndSetCookie(user._id, res);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      bio: user.bio,
      profilePic: user.profilePic,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in loginUser:", error.message);
  }
};

//logout user
const logoutUser = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 1 });
    res.status(200).json({ message: "User logged Out Successfully !" });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in logging Out the User", error.message);
  }
};

//follow unfollow user
const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (id === req.user._id.toString())
      return res
        .status(400)
        .json({ message: "You can't follow/unfollow yourseld !" });

    if (!userToModify || !currentUser)
      return res.status(400).json({ error: "User Not Found !" });

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      //unfollow user
      //modify the current user following and modify the followers of the userToModify
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      res.status(200).json({ message: "User Unfollowed Successfully !" });
    } else {
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
      res.status(200).json({ message: "User Followed Successfully !" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error doing Follow/Unfollow:", error.message);
  }
};

//update user
const updateUser = async (req, res) => {
  const { username, name, password, email, bio } = req.body;
  let { profilePic } = req.body;
  const userId = req.user._id;
  try {
    let user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: "User Not Found !" });

    if (req.params.id !== userId.toString())
      return res
        .status(400)
        .json({ messages: "You can't update other user's profile !" });

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user.password = hashedPassword;
    }

    if (profilePic) {
			if (user.profilePic) {
				await cloudinary.uploader.destroy(user.profilePic.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(profilePic);
			profilePic = uploadedResponse.secure_url;
		}

    user.name = name || user.name;
    user.email = email || user.email;
    user.username = username || user.username;
    user.profilePic = profilePic || user.profilePic;
    user.bio = bio || user.bio;

    user = await user.save();

    //find all the post that this user replied and update username and profilePic fields
    await Post.updateMany(
      { "replies.userId":userId },
      {
        $set : {
          "replies.$[reply].username":user.username,
          "replies.$[reply].userProfilePic":user.profilePic,
        },
      },
      {arrayFilters:[{"reply.userId":userId}]}
    );

    //password should be null in response
    user.password = null;

    res
      .status(200)
      .json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error in updateUser", error.message);
  }
};

//get user profile
const getUserProfile = async (req,res) =>{
  //we will fetch user profile either by username or userId
  //query can either be username or userId
  const {query} = req.params;

  try {
    let user;

    //query is userId
    if(mongoose.Types.ObjectId.isValid(query)){
      user = await User.findOne({_id:query}).select("-password").select("-updatedAt");
    }else{
      //query is username
      user = await User.findOne({username:query}).select("-password").select("-updatedAt");
    }
    if(!user) return res.status(400).json({error : "User Not Found !"});

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({error : error.message});
    console.log("Error in gerUserProfile:",error.message);
  }
}

export { signupUser, loginUser, logoutUser, followUnfollowUser, updateUser, getUserProfile };
