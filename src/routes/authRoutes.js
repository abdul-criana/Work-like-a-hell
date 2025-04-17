import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const generateToken = (userId) => {
    return jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: "15d"});
}

router.post("/signup", async (req, res) => {
    try {
        const {email, password, fullname} = req.body;

        if (!email || !password || !fullname) {
            return res.status(400).json({message: "All fields are required to signup"});
        }

        if (password.length < 8) {
            return res.status(400).json({message: "Password must be at least 8 characters long"});

        }

        // Check if user with email already exists
        const existingEmail = await User.findOne({$or:[{email}]});
        if (existingEmail) {
            return res.status(400).json({message: "Email already exists"});
        }

        const existingFullname = await User.findOne({$or:[{fullname}]});
        if (existingFullname) {
            return res.status(400).json({message: "This Name already exists"});
        }

        // get random avatar
        const profilePicture = `https://api.dicebear.com/9.x/avataaars/svg?seed=${fullname}`;

        // Create a new user
        const user = new User({
            email, 
            password, 
            fullname,
            profilePicture,
        })

        await user.save();

        const token = generateToken(user._id);
        res.status(201).json({
            token, 
            user: {
                id: user._id,
                email: user.email,
                fullname: user.fullname, 
                profilePicture: user.profilePicture,
            },
            
            });

    } catch (error) {
        console.log("Error in signup route", error);
        res.status(500).json({message: "Something went wrong. Please try again later"});
    }
});

router.post("/login", async (req, res) => {

try {
    const {email, password} = req.body;
    if (!email || !password)
        return res.status(400).json({message: "All fields are required to login"});
    
    // Check if user exists
    const user = await User.findOne({email});
    if (!user)
        return res.status(400).json({message: "Invalid credentials"});

    // Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect)
        return res.status(400).json({message: "Invalid credentials"});


    const token = generateToken(user._id);
    res.status(200).json({
        token, 
        user: {
            id: user._id,
            email: user.email,
            fullname: user.fullname,
            profilePicture: user.profilePicture,
        },
    });
}
catch (error) {
    console.log("Error in login route", error);
    res.status(500).json({message: "Internal server error. Please try again later"});
}
});

export default router;