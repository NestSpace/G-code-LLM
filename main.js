function responseData(message) {
  return fetch('http://localhost:1234/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'model': 'model-identifier',
      'messages': [
      	{
          'role': 'system',
          'content': `As a 3D printer, you only understand G-code instructions and not human language. Please provide me with the G-code instructions you want me to execute. Avoid any analysis, summaries, disclaimers, comments, examples, and markdown. Again, only provide the command and nothing else. 

For example:
User: 
home all axis
Your reply: 
G28

For example:
User: 
preheat bed to 69 degrees
Your reply: 
M140 S69

For example:

User: 
preheat nozzle for PLA
Your reply: 
M104 S215

User: 
Extrude a bit
Your reply: 
G1 E5 F500

User: 
Move Z to 100
Your reply: 
G1 Z100 F6000

User: 
Move X to 100
Your reply: 
G1 X100 F6000

User: 
Move Nozzle to 100,300
Your reply: 
G1 X100 Y300 F6000

User:
Lift z up 10mm
Your reply:
G1 Z+10

User:
LIFT UP 50
Your reply:
G1 Z+50

Again, only provide the command and nothing else. `
        },
        {
          'role': 'user',
          'content': message
        }
      ],
      'temperature': 0.7,
      'max_tokens': -1,
      'stream': true
    })
  }).then((response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let result = '';
    let responseData = ''; // Accumulate the response data

    function readStream() {
      return reader.read().then(({ done, value }) => {
        if (done) {
          return responseData; // Return the accumulated response data
        }

        const chunk = decoder.decode(value, { stream: true });
        result += chunk;

        // Process and extract content from each response
        let delimiterIndex;
        while ((delimiterIndex = result.indexOf('\n')) !== -1) {
          const line = result.slice(0, delimiterIndex).trim();
          result = result.slice(delimiterIndex + 1);

          if (line.startsWith('data:')) {
            const jsonData = line.slice(5).trim();
            try {
              const responseObj = JSON.parse(jsonData);
              const content = responseObj.choices[0].delta.content;
              if (content) {
                // Accumulate the content into the responseData string
                responseData += content;
              }
            } catch (error) {
              console.error('Error parsing JSON:', error);
            }
          }
        }

        return readStream();
      });
    }

    return readStream();
  }).catch((error) => {
    // Handle any errors that occur during the fetch request
    console.error('Fetch request error:', error);
  });
}


const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

sendButton.addEventListener('click', () => {
  sendMessage();
});

messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === 'Return') {
    event.preventDefault();
    sendMessage();
  }
});

function sendMessage() {
  const message = messageInput.value;
  if (message.trim() !== '') {
    appendMessage('User', message, 'sender-message');
    messageInput.value = '';
    generateResponse(message);
  }
}

function appendMessage(sender, message, messageClass) {
  const messageElement = document.createElement('p');
  messageElement.innerHTML = message;
  messageElement.setAttribute("sender",sender);
  messageElement.classList.add(messageClass);
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
  if(sender=='Bot'){
  	sendGCode(message);
  }
}

function generateResponse(InputMessage) {

  responseData(InputMessage).then((response) => {
    console.log(response); 
    // Log the accumulated response string
    setTimeout(() => {
      appendMessage('Bot', response, 'receiver-message');
    }, 10);
  }).catch((error) => {
    console.error('Error:', error);
  });
  
  /*
  const responses = [
    "Hello!",
    "How can I assist you?",
    "That's interesting!",
    "Tell me more.",
    "I'm here to help."
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  setTimeout(() => {
    appendMessage('Bot', randomResponse, 'receiver-message');
  }, 500);
  */
}

function sendGCode(script) {
  // Create a new XMLHttpRequest object
  var xhr = new XMLHttpRequest();

  // Set the HTTP method and URL
  var method = "GET";
  var baseUrl = "http://localhost:7125/printer/gcode/script";
  var url = baseUrl + "?script=" + encodeURIComponent(script);
  xhr.open(method, url, true);

  // Set the callback function to handle the response
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        // Request was successful
        console.log(xhr.responseText);
      } else {
        // Request failed
        console.error("Request failed with status:", xhr.status);
      }
    }
  };

  // Send the request
  xhr.send();
}

const startButton = document.getElementById('startButton');
const outputInput = document.getElementById('message-input');

const recognition = new webkitSpeechRecognition();
recognition.lang = 'en-US';

recognition.onstart = () => {
console.log('listening')
    outputInput.placeholder = 'Listening...';
};

recognition.onsoundstart = () => {
console.log('listening sound')
    outputInput.placeholder = 'Listening sound...';
};

recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    outputInput.value = transcript;
};

recognition.onend = () => {
    startButton.textContent = 'Start Voice Input';
};

startButton.addEventListener('click', () => {
    recognition.start();
});
