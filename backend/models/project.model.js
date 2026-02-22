import mongoose from 'mongoose';


const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    dueDate: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        lowercase: true,
        required: true,
        trim: true,
        unique: [true, 'Project name must be unique'],
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    favoritedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    ],
    users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    ],
    tasks: [taskSchema],
    messages: [
        {
            sender: {
                type: mongoose.Schema.Types.Mixed, // ObjectId reference to user or "ai" string
                required: true
            },
            message: {
                type: String,
            },
            files: [
                {
                    type: Object
                }
            ],
            fileTree: {
                type: Object
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ],
    fileTree: {
        type: Object,
        default: {}
    },

}, { timestamps: true })


const Project = mongoose.model('project', projectSchema)


export default Project;