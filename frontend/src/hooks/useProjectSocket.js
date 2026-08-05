import { useRef, useCallback } from 'react'
import { initializeSocket, receiveMessage } from '../config/socket'
import { debounce } from '../utils/performance'

/**
 * useProjectSocket
 *
 * Encapsulates all Socket.io setup, message handling, and cleanup
 * for the Project page. Returns a disconnect function for cleanup.
 *
 * @param {object} params
 * @param {string}   params.projectId
 * @param {string}   params.currentUserId
 * @param {Function} params.onMessage        — called with incoming project-message data
 * @param {Function} params.onFileMessage    — called with incoming file-message data
 * @param {Function} params.onReaction       — called with reaction update data
 * @param {Function} params.onTypingStart    — called with typing user data
 * @param {Function} params.onTypingStop     — called with typing user data
 * @returns {{ sendTyping: Function, socket: object|null }}
 */
const useProjectSocket = ({
    projectId,
    currentUserId,
    onMessage,
    onFileMessage,
    onReaction,
    onTypingStart,
    onTypingStop,
}) => {
    const socketRef = useRef(null)

    // Debounced typing stop — avoids flooding socket with stop events
    const debouncedTypingStop = useRef(
        debounce((socket) => {
            socket?.emit('user-typing', { typing: false })
        }, 2000)
    ).current

    /**
     * Initialize socket and register all listeners.
     * Must be called once when the component mounts.
     * Returns a cleanup function to remove all listeners.
     */
    const connect = useCallback(() => {
        if (!projectId) return () => {}

        const socket = initializeSocket(projectId)
        socketRef.current = socket

        const messageHandler = (data) => {
            if (!data.timestamp) data.timestamp = new Date().toISOString()
            // Skip echo of own messages (already shown locally)
            if (data.sender?._id === currentUserId) return
            onMessage?.(data)
        }

        const fileMessageHandler = (data) => {
            if (!data.timestamp) data.timestamp = new Date().toISOString()
            if (data.sender?._id === currentUserId) return
            onFileMessage?.(data)
        }

        const reactionHandler = (data) => {
            onReaction?.(data)
        }

        const typingStartHandler = (data) => {
            onTypingStart?.(data)
        }

        const typingStopHandler = (data) => {
            onTypingStop?.(data)
        }

        receiveMessage('project-message', messageHandler)
        receiveMessage('project-file-message', fileMessageHandler)
        receiveMessage('message-reaction', reactionHandler)
        receiveMessage('user-typing-start', typingStartHandler)
        receiveMessage('user-typing-stop', typingStopHandler)

        // Return cleanup function
        return () => {
            debouncedTypingStop.cancel?.()
            if (socket) {
                socket.off('project-message', messageHandler)
                socket.off('project-file-message', fileMessageHandler)
                socket.off('message-reaction', reactionHandler)
                socket.off('user-typing-start', typingStartHandler)
                socket.off('user-typing-stop', typingStopHandler)
            }
        }
    }, [projectId, currentUserId, onMessage, onFileMessage, onReaction, onTypingStart, onTypingStop, debouncedTypingStop])

    /**
     * Emit a typing indicator. Debounced internally — safe to call on every keystroke.
     */
    const sendTyping = useCallback(() => {
        const socket = socketRef.current
        if (!socket) return
        socket.emit('user-typing', { typing: true })
        debouncedTypingStop(socket)
    }, [debouncedTypingStop])

    return { connect, sendTyping, socketRef }
}

export default useProjectSocket
