import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
    emoji: {
        type: String,
        required: true
    },
    users: [
        {
            type: mongoose.Schema.Types.Mixed // can be user object or user _id
        }
    ]
}, { _id: false });

const fileSchema = new mongoose.Schema({
    url: String,
    originalName: String,
    size: Number,
    type: String
}, { _id: false });

const messageSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        default: () => new mongoose.Types.ObjectId().toHexString()
    },
    message: { 
        type: String, 
        default: '' 
    },
    // The sender object containing at least _id and email. 'ai' for AI messages
    sender: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'project',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    files: {
        type: [fileSchema],
        default: []
    },
    reactions: {
        type: [reactionSchema],
        default: []
    }
});

const Message = mongoose.model('message', messageSchema);
export default Message;
