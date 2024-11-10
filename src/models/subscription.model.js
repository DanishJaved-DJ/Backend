import mongoose ,{Schema} from "mongoose";

const subcriptionSchema = new Schema({
       subscriber : {
               type : Schema.types.ObjectId,
               ref : "User"
          },
          channel :{
              type : Schema.types.ObjectId,
              ref : "User"
          }


},{timestamps : true});

export const Subcription = mongoose.model("Subcription",subcriptionSchema);