const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
    title: String,
    author: String,
    content: String,
    file: String,
    email : String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});


const Postmodel = mongoose.model('posts', PostSchema)

module.exports = Postmodel;