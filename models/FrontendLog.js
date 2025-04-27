import mongoose from "mongoose";
const { Schema } = mongoose;

const schema = new Schema({
   
    functionName: {
        type: String,
        trim: true,
        required: true
    },
    
    screen: {
        type: String,
        trim: true,
        required: true
        },
        details: {
            type: String,
            trim: true,
            required: true
            },
    
    active:{
        type:Boolean,
        default:true
    }
 }, 
 {timestamps: true }
);

export const FrontendLog = mongoose.model("FrontendLog", schema);
