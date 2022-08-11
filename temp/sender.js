
const websocket = new WebSocket("wss://e9opf21h1c.execute-api.ap-south-1.amazonaws.com/production");

// Open Socket connection 
websocket.onopen = (e) => {
    console.log(' Connection established ... | Event: ', e )
}

// Connect sender with receiver
websocket.send(JSON.stringify({
    identifer: '101', 
    type: 'establish_connection', 
    user_type: 'sender'
}))

async function makeCall() {
    const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
    const peerConnection = new RTCPeerConnection(configuration);

    // TODO: get screen video
    
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    send_message({'offer': offer});
}

function send_message(object) {
   websocket.send(JSON.stringify(object))
}

signalingChannel.addEventListener('message', async message => {
    console.log('Received Event From WebSocket: ', message)
    if (message.answer) {
        const remoteDesc = new RTCSessionDescription(message.answer);
        await peerConnection.setRemoteDescription(remoteDesc);
    }
});

const handleSuccess = (stream) => {
    startButton.disabled = true;
    const video = document.querySelector('video');
    video.srcObject = stream;

    // demonstrates how to detect that the user has stopped
    // sharing the screen via the browser UI.
    stream.getVideoTracks()[0].addEventListener('ended', () => {
        errorMsg('The user has ended sharing the screen');
        startButton.disabled = false;
    });
}

const handleError = (error) => {
    errorMsg(`getDisplayMedia error: ${error.name}`, error);
}

const errorMsg = (msg, error) => {
    const errorElement = document.querySelector('#errorMsg');
    errorElement.innerHTML += `<p>${msg}</p>`;
    if (typeof error !== 'undefined') {
        console.error(error);
    }
}


// Starting of stream
const startButton = document.getElementById('startButton');
startButton.addEventListener('click', () => {
    navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(handleSuccess, handleError);
});

if ((navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices)) {
    startButton.disabled = false;
} else {
    errorMsg('getDisplayMedia is not supported');
}