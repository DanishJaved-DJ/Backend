import {asyncHandler} from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js";

export const verifyJWt = asyncHandler(async (req,res,next)=>{

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer","");
    
        if(!token){
            throw new ApiError(401,"Unauthorized error");
        }
    const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
    if(!user){
        //TODO : frontend
    
        throw new ApiError(401,"Invalid access token");
    }
    
    req.user=user;
    next();
    } catch (err) {
        throw new ApiError(401,"error");
        
    }

});

