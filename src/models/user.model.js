import mongoose ,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
        userName : {
            type : String ,
            required : true ,
            unique : true ,
            lowercase : true ,
            trim : true ,
            index : true  // optimal way for seaching 
        },
        email : {
            type : String ,
            required : true ,
            unique : true ,
            lowercase : true ,
            trim : true ,
         
        },
        fullName : {
            type : String ,
            required : true ,
            trim : true ,
            index : true  // optimal way for seaching 
        },
        avatar : {
            type : String ,// cloudinary URL
            required : true,

        },
        coverImage : {
            type : String ,// cloudinary URL

        },
        watchHistory : [
             {
                type : Schema.Types.ObjectId,
                ref :  "Video",

             }
        ],
        
        password : {
            type : String ,
            required : [true , "Password is required"]
        },

        refreshToken : {
            type : String
        }

},{timestamps:true});

//middleware mongoose hook , pre "save"-> perform operation before data save 
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password , 10);
    next();
});

userSchema.methods.isPasswordCorrect= async function (password) {
    return await bcrypt.compare( password,this.password);
}

userSchema.methods.generateAccessToken = function(){
    // payload-> data store 
  return  jwt.sign(
         { 
            //payload key : come form database 
            _id:this._id,
            email : this.email,
            userName : this.userName,
            fullName : this.fullName

         },
         process.env.ACCESS_TOKEN_SECRET,
         {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
         }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return  jwt.sign(
        { 
           //payload key : come form database 
           _id:this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
           expiresIn :process.env. REFRESH_TOKEN_EXPIRY
        }
   )
}

export const User = mongoose.model("User",userSchema);