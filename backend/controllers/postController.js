import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import {v2 as cloudinary} from "cloudinary";


//create post
const createPost = async (req, res) => {
  try {
    const { postedBy, text} = req.body;
    let { img } = req.body;

    if(!postedBy || !text){
        return res.status(400).json({error : "PostedBy and Text field are required !"});
    }

    const user = await User.findById(postedBy);
    if(!user){
        return res.status(404).json({error : "User Not Found !"});
    }

    if(user._id.toString() !== req.user._id.toString()){
        return res.status(401).json({error : "Unauthorized to create Post !"});
    }

    const maxLength = 500;
    if(text.length > maxLength){
        return res.status(400).json({error : `Text must be less than ${maxLength} characters`});
    }

    if(img){
        const uploadedResponse = await cloudinary.uploader.upload(img);
        img = uploadedResponse.secure_url;
    }

    const newPost = new Post({postedBy,text,img});

    await newPost.save();

    res.status(201).json( newPost );
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error Creating Post:",error.message);
  }
};

//get a post
const getPost = async(req,res)=>{
    try {
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({error:"Post not found!"});
        }
        res.status(200).json(post); 
    } catch (error) {
        res.status(500).json({error : error.message});
        console.log("Error in getting the Post:",error.message);
    }
}

//delete post
const deletePost = async (req,res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post) return res.status(404).json({error : "Post Not Found !"});

        if(post.postedBy.toString() !== req.user._id.toString()){
            return res.status(401).json({error : "Unauthorized to Delete this Post!"});
        }

        if(post.img) {
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        await Post.findByIdAndDelete(req.params.id);

        res.status(200).json({message : "Post Deleted Successfully!"});
    } catch (error) {
        res.status(500).json({error : error.message});
        console.log("Error in deleting the post:",error.message);
    }
}

//Like Unlike Post 
const likeUnlikePost = async(req,res) =>{
    try {
        const {id:postId} = req.params;

        const userId = req.user._id;

        const post = await Post.findById(postId);

        if(!post) return res.status(404).json({error : "Post Not Found!"});

        const userLikedPost = post.likes.includes(userId);

        if(userLikedPost){
            //unlike
            await Post.updateOne({_id:postId},{$pull:{likes:userId}});
            res.status(200).json({message : "Post Unliked Successfully!"});
        }else{
            //like
            post.likes.push(userId);
            await post.save();
            res.status(200).json({message : "Post Liked Successfully!"});
        }
    } catch (error) {
        res.status(500).json({error : error.message});
        console.log("Error in Liking And Unliking the Post:" , error.message);
    }
}

//reply to the post
const replyToPost = async (req,res) => {
    try {   
        const {text} = req.body;
        // const {id:postId} = req.params;
        const postId = req.params.id;
        const userId = req.user._id;
        const userProfilePic = req.user.profilePic;
        const username = req.user.username;

        if(!text){
           return  res.status(400).json({error : "Text field is required to reply on a post!"});
        }
        
        const post = await Post.findById(postId);
        
        if(!post) {
            return res.status(404).json({error : "Post Not Found!"});
        }
        
        const reply = { userId, text, userProfilePic, username };

        post.replies.push(reply);
        await post.save();

        res.status(200).json( reply );
    } catch (error) {
        res.status(500).json({error : error.message});
        console.log("Error in replying:",error.message);
    }
};

//get feed post
const getFeedPosts = async (req,res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if(!user){
            return res.status(404).json({error : "User Not Found!"});
        }

        const following = user.following;

        const feedPosts = await Post.find({ postedBy: { $in: following } }).sort({ createdAt: -1 });

        res.status(200).json(feedPosts);
    } catch (error) {
        res.status(500).json({error : error.message});
        console.log("Error in loading Feed for you:",error.message);
    }
}

//get userPosts
const getUserPosts = async (req,res) => {
    const {username} = req.params;
    try {
        const user = await User.findOne({username});
        if(!user) {
            return res.status(404).json({error:"User Not Found"}); 
        }
        const posts = await Post.find({postedBy:user._id}).sort({createdAt:-1});

        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({error:error.message});
    }
};

export { createPost , getPost , deletePost , likeUnlikePost , replyToPost , getFeedPosts , getUserPosts};
