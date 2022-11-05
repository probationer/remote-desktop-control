const websocket = new WebSocket("wss://ohm8v11s16.execute-api.ap-south-1.amazonaws.com/dev");
const USER_TYPE = 'sender';
const TEMP_ID = '111';
const WebRTC_CONFIGURATION = { 'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}] }
var rtcConnectionObj = null;
var localStream = null;
var senders = []

// Open Socket connection
websocket.onopen = (e) => {
    console.log(' Connection established ... | Event: ', e )
}

// Starting of stream
const startButton = document.getElementById('setConnId');
startButton.addEventListener('click', () => {
    startButton.disabled = true
    websocket.send(JSON.stringify({
        identifer: TEMP_ID,
        type: 'establish_connection',
        user_type: USER_TYPE
    }))
    send_message({ identifer: TEMP_ID, type: 'send_message', user_type: USER_TYPE, channel: 'window_size', event: { screenSize: {width: 2560, height: 1600} } })
    navigator.mediaDevices.getDisplayMedia({ video: true })
    .then(handleSuccess, handleError);
});


// Handle Display media success
const handleSuccess = async (localStream) => {

    startButton.disabled = true;
    const peerConnection = new RTCPeerConnection(WebRTC_CONFIGURATION);

    console.log(' stream : ', localStream)
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // peerConnection.addStream(localStream)
    // const video = document.getElementById('gum-local');
    // video.srcObject = localStream;


    peerConnection.onicecandidate = (iceEvent) => {
        console.log('IceEvent : ', iceEvent);
        if (iceEvent && iceEvent.candidate) {
            send_message({ identifer: TEMP_ID, user_type: USER_TYPE, type: 'send_message', 'new_ice_candidate': iceEvent.candidate });
        }
    };
    await createOfferAndSend(peerConnection)
    rtcConnectionObj = peerConnection;

    //
    rtcConnectionObj.addEventListener('iceconnectionstatechange', e => {
        console.log(' Ice Connection state : ', e);
    });

    // demonstrates how to detect that the user has stopped
    // sharing the screen via the browser UI.
    localStream.getVideoTracks()[0].addEventListener('ended', () => {
        errorMsg('The user has ended sharing the screen');
        startButton.disabled = false;
    });
}

if ((navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices)) {
    startButton.disabled = false;
  } else {
    console.log('getDisplayMedia is not supported');
  }

const handleError = (error) => {
    errorMsg(`getDisplayMedia error: ${error.name}`, error);
}


// create rtc local offer and send to other person
const createOfferAndSend = async (peerConnection) => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    await send_message({ identifer: TEMP_ID, user_type: USER_TYPE, type: 'send_message', offer: offer });
}

websocket.addEventListener('message', async message => {
    console.log('Received Event From WebSocket: ', message.data)
    const answer = JSON.parse(message.data).answer;
    console.log('Answer : ', answer);
    // if we got response(answer) from receiver side
    if (answer) {
        await setRemoteDescription(answer)
    }

    const iceCandidate = JSON.parse(message.data).new_ice_candidate
    console.log({iceCandidate})
    if (iceCandidate) {
        await addRemoteICECandidate(iceCandidate)
    }

})

const setRemoteDescription = async (answer) => {
    console.log('Setting remote description...');
    const remoteDesc = new RTCSessionDescription(answer);
    try {
        await rtcConnectionObj.setRemoteDescription(remoteDesc);
    } catch ( err ) {
        console.log('ERRROR caught while setting remote description : ', err);
    }
}

const addRemoteICECandidate = async (iceCandidate) => {
    try {
        await rtcConnectionObj.addIceCandidate(iceCandidate);
    } catch (e) {
        console.error('Error adding received ice candidate', e);
    }
}

// send message to other user
const send_message = async (object) => {
    websocket.send(JSON.stringify(object));
}

