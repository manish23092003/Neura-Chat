import socket from 'socket.io-client';


let socketInstance = null;


export const initializeSocket = (projectId) => {
    // If socket is already initialized with a different project ID, disconnect it
    if (socketInstance && socketInstance.query?.projectId !== projectId) {
        socketInstance.disconnect();
        socketInstance = null;
    }

    if (!socketInstance || !socketInstance.connected) {
        socketInstance = socket(import.meta.env.VITE_API_URL, {
            auth: {
                token: localStorage.getItem('token')
            },
            query: {
                projectId
            }
        });
        // Store project ID to check against later (though socket.io stores it in query too, but locally is safer if we want to be explicit)
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