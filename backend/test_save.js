import 'dotenv/config';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/neurachat');
        console.log("Connected to DB");

        const projectId = '6957a459f1e677f58d6abab7'; // roket

        console.log(`Attempting to save message to project ${projectId}`);

        const result = await projectModel.findByIdAndUpdate(projectId, {
            $push: {
                messages: {
                    sender: 'ai',
                    message: 'Test message from script',
                    timestamp: new Date()
                }
            }
        }, { new: true });

        console.log("Update result messages count:", result ? result.messages.length : 'null');
        if (result) {
            console.log("Last message:", result.messages[result.messages.length - 1]);
        }

    } catch (e) {
        console.error("Error saving:", e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
