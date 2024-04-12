// src/utils/socket.js
import io from 'socket.io-client';

// Assuming your server is running on localhost:4000
// eslint-disable-next-line no-unused-vars
const SERVER_URL = 'http://192.168.1.2:4000';


// Replace 'localhost' with the actual server's local IP address
const socket = io('ws://192.168.0.106:4000', { transport : ['websocket'] });


export default socket;