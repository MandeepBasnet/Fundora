const io = require('socket.io-client');
const axios = require('axios');

async function test() {
  try {
    // 1. Log in as Creator
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', { 
      email: 'creator1@example.com', 
      password: 'password123' 
    });
    
    if(!loginRes.data.token) {
      console.error('No token. Use correct creator email.');
      return;
    }
    
    const token = loginRes.data.token;
    console.log('Got creator token');
    
    // 2. Connect Socket
    const socket = io('http://localhost:5000', {
      auth: { token }
    });
    
    socket.on('connect', () => {
      console.log('Socket connected!', socket.id);
      
      const convId = '69aceb55d660cd6855a16bde'; // From user screenshot
      
      // 3. Try to send message
      console.log('Sending message to', convId);
      socket.emit('send_message', {
        conversationId: convId,
        content: 'Test reply from creator script'
      });
      
      setTimeout(() => {
        console.log('Done waiting for send_message execution.');
        process.exit(0);
      }, 3000);
    });
    
    socket.on('connect_error', (err) => {
      console.error('Socket connect err', err.message);
      process.exit(1);
    });

    socket.on('message_error', (err) => {
      console.error('Socket message_error', err);
    });
    
  } catch(e) { 
    console.error('Error', e.response?.data || e.message); 
    process.exit(1);
  }
}

test();
