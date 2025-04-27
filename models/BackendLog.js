import mongoose from "mongoose";
const { Schema } = mongoose;

const schema = new Schema({
   
    fileName: {
        type: String,
        trim: true,
        required: true 
    },
    
    functionName: {
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

export const BackendLog = mongoose.model("BackendLog", schema);
