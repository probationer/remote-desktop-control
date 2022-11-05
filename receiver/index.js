const websocket = new WebSocket("wss://ohm8v11s16.execute-api.ap-south-1.amazonaws.com/dev");
const USER_TYPE = 'receiver';
var peerConnection = null;
const configuration = { 'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}] }
let connection_id = '101';
let is_screen_size_exists = false;
let screen_size = undefined;

// Open Socket connection
websocket.onopen = (e) => {
    console.log(' Connection established ... | Event: ', e)
}


// set connection
const setConnectionButton = document.getElementById('setConnection');
setConnectionButton.addEventListener('click', () => {
    setConnectionButton.disabled = true
    const connIdInput = document.getElementById('connId');
    console.log("input value : ", connIdInput.value)

    connIdInput.placeholder = connection_id = connIdInput.value
    connIdInput.value = ''

    websocket.send(JSON.stringify({
        identifer: connection_id,
        type: 'establish_connection',
        user_type: USER_TYPE
    }))
    
    peerConnection = new RTCPeerConnection(configuration);
    console.log('Connection established...');

    // waiting to setup ice candidate
    peerConnection.onicecandidate = (iceEvent) => {
        console.log(' Ice Event : ', iceEvent);
        if (iceEvent && iceEvent.candidate) {
            send_message({ identifer: connection_id, user_type: USER_TYPE, type: 'send_message', 'new_ice_candidate': iceEvent.candidate });
        }
    };
    
});

const show_video_stream = () => {
    peerConnection.addEventListener('track', async (event) => {
        console.log('screen_size ===>', is_screen_size_exists, screen_size)
        if ( is_screen_size_exists ) {
            const remoteVideo = document.getElementById('displayVideo');
            const [remoteStream] = event.streams;
            remoteVideo.srcObject = remoteStream;
            remoteVideo.height = screen_size.height;
            remoteVideo.width = screen_size.width;
            // Avoid using this in new browsers, as it is going away.
            remoteVideo.autoplay = true
            const videoCanvasDimensions = remoteVideo.getBoundingClientRect()
            console.log('videoCanvasDimensions : ', videoCanvasDimensions)
            // remoteVideo.config
            // start mouse movement after streaming
            capture_and_send_mouse_movement(remoteVideo, videoCanvasDimensions)
        }
    });

}  

websocket.addEventListener('message', async message => {
    console.log('Message Received: ', message.data);
    const data = JSON.parse(message.data)
    const offer = data.offer
    if (offer) {
        const remoteDesc = new RTCSessionDescription(offer);
        await peerConnection.setRemoteDescription(remoteDesc);

        console.log('Setting up offer and sending answer ... ')
        const answer = await peerConnection.createAnswer();
        console.log('answer', answer)
        await peerConnection.setLocalDescription(answer);
        await send_message({identifer: connection_id, user_type: USER_TYPE, type:'send_message', 'answer': answer});
    }

    const iceCandidate =data.new_ice_candidate
    console.log({iceCandidate})
    if (iceCandidate) {
        addRemoteICECandidate(iceCandidate)
    }

    const remote_screen = data.event ? data.event.screenSize || null : null; 
    console.log({remote_screen})
    if(remote_screen) {
        screen_size = remote_screen
        is_screen_size_exists = true
        show_video_stream()
    }

});

const addRemoteICECandidate = async (iceCandidate) => {
    try {
        await peerConnection.addIceCandidate(iceCandidate);
    } catch (e) {
        console.error('Error adding received ice candidate', e);
    }
}


// send message to other user
const send_message = async (object) => {
    websocket.send(JSON.stringify(object));
}

const capture_and_send_mouse_movement = (trackerId ,videoCanvasDimensions) => {
    // Capture mouse click movement
    trackerId.addEventListener("mouseup", async (e) => {
        // gets the object on image cursor position
        console.log('mouse click event : ', e.x, e.y)
        await send_message({identifer: connection_id, user_type: USER_TYPE, type:'mouse_click', event: {x, y, canvasDim: videoCanvasDimensions}});
    })

    // capture mouse movement
    trackerId.addEventListener("mousemove", async (e) => {

        // Gets the x,y position of the mouse cursor
        x = e.clientX;
        y = e.clientY;
        console.log({ x, y })
        // send_coordinates(e)
        await send_message({identifer: connection_id, user_type: USER_TYPE, type:'mouse_movement', event: {x, y, canvasDim: videoCanvasDimensions}});
        // websocket.send(JSON.stringify({ action: "$sendMessage", "coordinates": {x, y} }))
    });

}

window.addEventListener('wheel', async (e) => {
        console.log(' e : ', e)
})