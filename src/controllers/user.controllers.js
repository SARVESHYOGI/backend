import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/ApiResponse.js';

// const generateAccessandRefreshTokens = async (userId) => {
//     try {
//         const user = await User.findById(userId)
//         const accessToken = user.generateAccessToken()

//         const refreshToken = user.generateRefreshToken()
//         user.refreshToken = refreshToken
//         await user.save({ validateBeforeSave: false })

//         return { accessToken, refreshToken }

//     } catch (error) {
//         throw new ApiError(500, "Error in generating tokens")

//     }
// }

const generateAccessandRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();

        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Error in generating tokens");
    }
};


const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validation -not empty
    // check if user exists :: username and email
    // check for images and avtar
    //upload them to cloudinary
    // check avtar
    //create user object
    //create entry in db
    //remove password from request token field from response
    // check for user creation
    // return res

    const { fullName, email, username, password } = req.body;
    //console.log("email:", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath = "";
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar and cover image are required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Error in uploading avatar images")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),

    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "Error in creating user")
    }

    return res.status(201).json(new ApiResponse(200, createdUser, "User created successfully"))

});

const loginUser = asyncHandler(async (req, res) => {
    //req bodey->data
    //username or email
    //find the user
    //pasward chck
    //access and refresh token
    //send cookies

    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required")
    }
    // if (!(username || email) || !password) { // Ensure either username or email and password are provided
    //     throw new ApiError(400, "Username or email and password are required");
    // }
    const user = await User.findOne({ $or: [{ username }, { email }] })

    if (!user) {
        throw new ApiError(404, "User not found")
    }
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password")
    }
    const { accessToken, refreshToken } = await generateAccessandRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"

        ))
});


const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        { new: true }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))

})

export { registerUser, loginUser, logoutUser };

