import socket from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://neura-chat-backend-q81j.onrender.com';

let socketInstance = null;

export const initializeSocket = (projectId) => {
    // If socket is already initialized with a different project, disconnect it
    if (socketInstance && socketInstance.query?.projectId !== projectId) {
        socketInstance.disconnect();
        socketInstance = null;
    }

    if (!socketInstance || !socketInstance.connected) {
        socketInstance = socket(API_BASE_URL, {
            auth: {
                token: localStorage.getItem('token')
            },
            query: {
                projectId
            }
        });

        // Store projectId on the instance for caching checks
        socketInstance.query = { projectId };
    }

    return socketInstance;

}

export const receiveMessage = (eventName, cb) => {
    // Remove all existing listeners for this event to prevent duplicates
    socketInstance.off(eventName);
    // Add the new listener
    socketInstance.on(eventName, cb);
}

export const sendMessage = (eventName, data) => {
    socketInstance.emit(eventName, data);
}