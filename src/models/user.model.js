import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        index: true,
    },
    avatar: {
        type: String,
        required: true,
    },
    coverImage: {
        type: String,
    },
    watchHistory: {
        type: Schema.Types.ObjectId,
        ref: "Video",
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true })

//do anything before the db starts use PRE
userSchema.pre('save', async function (next) {

    //if password is not modified do nothing
    if (!this.isModified("password")) return;

    //if password is change/modified
    this.password = await bcrypt.hash(this.passwords, 10);

    //do this and go next steps ita a middleware 
    next();
});

//check the password is correct or not use isPasswordCorrect is by default given by mongoose
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

//generate the access token 
userSchema.methods.generateAccessToken = async function () {
    return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

//generate the refresh token 
userSchema.methods.generateFreshToken = async function () {
    return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}


export const User = mongoose.model("User", userSchema);