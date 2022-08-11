/*
 *  Copyright (c) 2018 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
'use strict';
const websocket = new WebSocket("wss://e9opf21h1c.execute-api.ap-south-1.amazonaws.com/production");


// Polyfill in Firefox.
// See https://blog.mozilla.org/webrtc/getdisplaymedia-now-available-in-adapter-js/
if (adapter.browserDetails.browser == 'firefox') {
    adapter.browserShim.shimGetDisplayMedia(window, 'screen');
}

function handleSuccess(stream) {
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

function handleError(error) {
    errorMsg(`getDisplayMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
    const errorElement = document.querySelector('#errorMsg');
    errorElement.innerHTML += `<p>${msg}</p>`;
    if (typeof error !== 'undefined') {
        console.error(error);
    }
}

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







websocket.addEventListener("open", function (event) {
    websocket.send(JSON.stringify({ action: "$connect", "client_type": "controller" }))

    let x, y;
    let px, py;
    px = py = 0;

    // Image of cursor
    let cursor = document.getElementById("cursor");


    /*
    The following event is selecting the element
    on the image cursor and fires click() on it.
    The following event is triggered only when mouse is pressed.
    */

    window.addEventListener("mouseup", function (e) {

        // gets the object on image cursor position
        let tmp = document.elementFromPoint(x + px, y + py);
        tmp.click();
        cursor.style.left = (px + x) + "px";
        cursor.style.top = (py + y) + "px";
    })

    /* The following event listener moves the image pointer
    with respect to the actual mouse cursor
    The function is triggered every time mouse is moved */
    window.addEventListener("mousemove", function (e) {

        // Gets the x,y position of the mouse cursor
        x = e.clientX;
        y = e.clientY;

        console.log({ x, y })
        // send_coordinates(e)
        websocket.send(JSON.stringify({ action: "$sendMessage", "coordinates": {x, y} }))
        // sets the image cursor to new relative position
        cursor.style.left = (px + x) + "px";
        cursor.style.top = (py + y) + "px";
    });

})

websocket.addEventListener('message', function (event) {
    console.log('Message from server ', event);
});


// function putDynamodb(client_conn_id, controller_conn_id) {
//     const params = {
//         TableName: "simplechat_connections",
//         Item: {
//             "connectionId": 101,
//             "client": client_conn_id,
//             "controller": controller_conn_id
//         }
//     };
//     documentClient.put(params, function (err, data) {
//         if (err) {
//             console.error("Can't add song. Darn. Well I guess Fernando needs to write better scripts.");
//         } else {
//             console.log("Succeeded adding an item for this song: ", data);
//         }
//     });
// }