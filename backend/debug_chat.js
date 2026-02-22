import 'dotenv/config';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/neurachat');
        console.log("Connected to DB");

        const projects = await projectModel.find({});
        console.log(`Found ${projects.length} projects`);

        for (const p of projects) {
            console.log(`Project: ${p.name}`);
            console.log(`ID: ${p._id}`);
            if (p.messages && p.messages.length > 0) {
                console.log(`Messages: ${p.messages.length}`);
                console.log(JSON.stringify(p.messages[p.messages.length - 1]));
            } else {
                console.log(`Messages: 0`);
            }
            console.log('---');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
