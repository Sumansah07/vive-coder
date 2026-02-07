// Test Sandbox Agent SSE stream
const sessionId = 'bolt-default-session';
const baseUrl = 'http://127.0.0.1:2468';

async function testStream() {
  try {
    // Post a message
    console.log('Posting message...');
    const postResponse = await fetch(`${baseUrl}/v1/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Create a hello.js file that prints Hello World' }),
    });
    
    if (!postResponse.ok) {
      console.error('Failed to post message:', await postResponse.text());
      return;
    }
    
    console.log('Message posted successfully');
    
    // Stream events
    console.log('Streaming events...');
    const streamResponse = await fetch(`${baseUrl}/v1/sessions/${sessionId}/events/sse`);
    
    if (!streamResponse.ok) {
      console.error('Failed to stream events:', await streamResponse.text());
      return;
    }
    
    const reader = streamResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let eventCount = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Parse SSE events
      let index = buffer.indexOf('\n\n');
      while (index !== -1) {
        const chunk = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        
        const dataLines = chunk.split('\n').filter(line => line.startsWith('data:'));
        if (dataLines.length > 0) {
          const payload = dataLines.map(line => line.slice(5).trim()).join('\n');
          if (payload) {
            try {
              const event = JSON.parse(payload);
              eventCount++;
              console.log(`Event ${eventCount}:`, event.type, event.data ? JSON.stringify(event.data).substring(0, 100) : '');
              
              // Stop after 20 events or turn completed
              if (eventCount >= 20 || event.type === 'turn.completed') {
                console.log('Stopping...');
                reader.cancel();
                return;
              }
            } catch (e) {
              console.warn('Failed to parse:', payload);
            }
          }
        }
        
        index = buffer.indexOf('\n\n');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testStream();
