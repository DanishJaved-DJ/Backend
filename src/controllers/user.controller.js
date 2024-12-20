import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken= async (userId)=> {
      try {
           const user = await User.findById(userId);
           const accessToken = user.generateAccessToken();
           const refreshToken = user.generateRefreshToken();
           // saving refresh token to db
           user.refreshToken = refreshToken;
          await user.save({validateBeforeSave:false});

          return {accessToken , refreshToken};

      } catch (err) {
            throw new ApiError(500,"something went wrong while generating access and refresh token");
      }
}

const registerUser=asyncHandler(async(req,res)=>{
      //1. get the data form forntend
      //2. validation-not empty
      //3. check if the user already exist - userName , email
      //4. check for image , check for avatar
      //5. upload them to the cloudianry - avatar
      //6. create a user object - entry to db
      //7. remove password and refresh token form response
      //8. check for user creation
      //9. return res


      const {userName , fullName, email , password} = req.body;
        
      if(!userName || !fullName || !email || !password){
         throw new ApiError(400 , "all fields are required");    
      }

      const existedUser = await User.findOne({
            $or: [{ userName }, { email }]
      });
      
      if(existedUser){
            throw new ApiError(409,"userName or email already exist");
      }

      //multer
      const avatarLocalPath = req.files?.avatar[0]?.path ; 
      // const coverImageLocalPath = req.files?.coverImage[0]?.path ; 
      let coverImageLocalPath;
      if(req.files &&  Array.isArray(req.files.coverImage)  && req.files.coverImage.length>0){
            coverImageLocalPath = req.files.coverImage[0].path
      }
      
      // console.log(req.files);
      

      if(!avatarLocalPath){
            throw new ApiError(400,"avatar filed is required");
      }

      //upload to cloudinary
const avatar = await uploadOnCloudinary(avatarLocalPath);
const coverImage = await uploadOnCloudinary(coverImageLocalPath);


// console.log(avatar);


if(!avatar){
      throw new ApiError(400,"Avatar filed is required");
}

//datbase entry
 const user =await User.create({
      fullName,
      avatar:avatar.url,
      coverImage : coverImage?.url || "",
      email ,
      password ,
      userName : userName.toLowerCase()
});

const userCreated = await User.findById(user._id).select( "-password -refreshToken");

if(!userCreated){
      throw ApiError(500,"something went wrong while user entry");
}

return res.status(200).json(
      new ApiResponse(200,userCreated,"user registed Successfully")
)

});

const loginUser = asyncHandler( async (req,res)=>{
      //1.req.body-data
      //2.username or email
      //3.user exist
      //4. password check
      //5. access and refresh token
      //6. send token to the cookies

      const { userName , email , password}=req.body;

      if(!userName || !email || !password){
            throw new ApiError(400,"every field is required");
      }

    const user = await User.findOne({
            $or :[{userName},{email}]
      });

      if(!user){
            throw new ApiError(404,"user does not exist");
      }

      const isPasswordValid = await user.isPasswordCorrect(password);
      if(!isPasswordValid){
            throw new ApiError(404,"incorrect user Password");
      }
      const {accessToken , refreshToken} =  await generateAccessAndRefreshToken(user._id);

      // sending to the cookies
      const loggedInUser = await User.findById(user._id).select("-passeord -refreshToken");

      const option = {
            httpOnly : true ,
            secure : true
      }

      return res
      .status(200)
      .cookie("accessToken",accessToken,option)
      .cookie("refreshToken",refreshToken,option)
      .json( new ApiResponse(200, 
            {
               user : loggedInUser , accessToken , refreshToken
            },
              "user loggedIn sucessfully")
            )
      });

const logoutUser = asyncHandler( async (req,res)=>{
     await  User.findByIdAndUpdate(req.user._id,{
            $set:{
                  refreshToken:undefined
            }
        },{
            new:true
        });

        const option = {
            httpOnly : true ,
            secure : true
      }
      return res.
      status(200)
      .clearCookie("accessToken",option)
      .clearCookie("refreshToken",option)
      .json(
            new ApiResponse(200,"User logged out !")
      );


})

const refreshAccessToken = asyncHandler( async(req,res)=>{
      const inComingToken = req.cookies.refreshToken || req.body.refreshToken;

      if(!inComingToken){
            throw new ApiError(401,"unAuthorized Error");
      }

      const decodedToken = jwt.verify(
            inComingToken,
             process.env.REFRESH_TOKEN_SECRET 
      )
       const user  = await User.findById(decodedToken?._id);
       if(!user){
            throw new ApiError(401,"Invalid Refresh Token");
       }
       if(inComingToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh Token is expired or used");
       }

       const option={
            httpOnly : true,
            secure : true
       }
       const {accessToken , newrefreshToken} = await generateAccessAndRefreshToken(user._id);

       return res
       .status(200)
       .cookie("accessToken",accessToken,option)
       .cookie("refreshToken",newrefreshToken,option)
       .json(
            new ApiResponse(200,{
                  accessToken,
                  refreshToken : newrefreshToken
            }),"AccessToken Refreshed"
       )
});

const changeCurrentPassword = asyncHandler( async (req,res)=>{
      const {oldPassword , newPassword} = req.body;
      // since loggedin - req.user -> exist(auth.middleware)
      const user = await User.findById(req.user?._id);

      const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
       if(!isPasswordCorrect){
            throw new ApiError(400,"Invalid Old password");
       }

        user.passeord=newPassword;
        await user.save({validateBeforeSave:false});

        return res
        .status(200)
        .json(new ApiResponse(200,{},"Password changed successfully"))
});

const getCurrentUser = asyncHandler(async (req,res)=>{
 return res
       .status(200)
       .json(200,{
            user: req.user 
       },
      "current user Detail fetched successfully"
)
});

const updateUserDetail = asyncHandler( async (req,res)=>{
      const {fullName,email} = req.body;

      if(!fullName || !email){
            throw new ApiError(400 , "All field required");
      }
    const user =   User.findByIdAndUpdate(
            req.user?._id,
            {
                  $set : {
                        fullName : fullName,
                        email : email
                  }
            },
            {
                  new : true
            }
         ).select("-password");
     return res
              .status(200)
              .json(200,{
                  user
              },
            "User Details Updated successfully")      
});

const updateUserAvatar = asyncHandler( async (req,res)=>{
      const avatarLocalPath = req.file?.path;
      if(!avatarLocalPath){
            throw new ApiResponse(400,"avatar file is missing");
      }

      const avatar = await uploadOnCloudinary(avatarLocalPath);
      if(!avatar.url){
            throw new   ApiError(400,"Avtar file is not uploaded on cloudinary");
      }

      const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                  $set : { 
                        avatar : avatar.url
                  }
            },
            {
                  new : true
            }
      ).select("-password");

      return res
               .status(200)
               .json(
                  new ApiResponse(200,{
                        user
                  },"Avatar file updated successfully")
               )
});

export { 
      registerUser,
      loginUser,
      logoutUser,
      refreshAccessToken,
      changeCurrentPassword,
      getCurrentUser,
      updateUserDetail,
      updateUserAvatar
      
};