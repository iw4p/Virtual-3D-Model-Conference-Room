// Join Room Funcs

function copyURL() {
    urlLink.select(); //select input value
    if (document.execCommand('copy')) { //if the selected text copy
        shareURLField.classList.add('active');
        copy.innerText = 'Copied';
        setTimeout(() => {
            window.getSelection().removeAllRanges(); //remove selection from document
            shareURLField.classList.remove('active');
            copy.innerText = 'Copy';
        }, 3000);
    }
}

function enterClicked() {
    if (modelName == "" || modelName == undefined) {
        modelName = 'Tester_Case';
    }
    let viewBtn = document.querySelector('#joinRoom');
    userName = nameField.value;
    if (userName.length > 1) {
        $('#joinRoom').hide();
        $('#leaveRoom').show();
        $('#chat').show();
        viewBtn.click();
        roomID = roomIDParamHandler('room');
        socket.roomID = roomID;
        socket.emit('join', roomID, userName, modelName);
    }
    //Dismiss keyboard
    document.activeElement.blur();

}

function enterClicked1() {
    if (modelName == "" || modelName == undefined) {
        modelName = 'Tester_Case';
    }
    let viewBtn = document.querySelector('#joinRoom');
    userName = nameField.value;
    if (userName.length > 1) {
        $('#joinRoom').hide();
        $('#leaveRoom').show();
        $('#chat').show();
        viewBtn.click();
        //roomID = roomIDParamHandler('room');
        socket.roomID = roomID;
        socket.emit('join', roomID, userName, modelName);
    }
    //Dismiss keyboard
    document.activeElement.blur();

}

function getEssentialInfo() {
    popup = document.querySelector('.popup');
    popup.classList.toggle('show');
    close = popup.querySelector('.close');
    nameField = document.getElementById('name-field');
    nameField.focus();
    enter = document.getElementById('Enter-btn');
    urlLink = $('#share-url');
    copy = document.getElementById('copy-btn');
    shareURLField = document.getElementById('share-url');
    let shareableURL = 'https://' + window.location.hostname + ':' + window.location.port + '/' + '?room=' + (roomIDParamHandler('room'));
    $('#share-url').val(shareableURL);
}

function joinRoomFunc() {
    let viewBtn = document.querySelector('#joinRoom');
    if (socket.connected) {
        getEssentialInfo();
        enter.onclick = () => {
            enterClicked();
        };
        copy.onclick = () => {
            copyURL();
        };
        close.onclick = () => {
            viewBtn.click();
        };
    } else {
        OV.ShowSocketDialog();
    }
}

function joinRoomFunc1() {
    let viewBtn = document.querySelector('#joinRoom');

    if (socket.connected) {
        getEssentialInfo();
        enter.onclick = () => {
            enterClicked1();
        };
        copy.onclick = () => {
            copyURL();
        };
        close.onclick = () => {
            viewBtn.click();
        };
    } else {
        OV.ShowSocketDialog();
    }
}

function leaveRoomFunc() {
    socket.emit('leave', roomID, userName);
    isJoinedInsideRoom = false;
    $('#joinRoom').show();
    $('#leaveRoom').hide();
    $('#chat').hide();
    $('#roomID').attr('disabled', false);
    for (let socket_id in peers) {
        removePeer(socket_id);
    }
    $('.arrow').css("display", "none");
    socket.roomID = null;
    roomID = null;
}

function leaveRoomFunc1() {
    isJoinedInsideRoom = false;
    $('#joinRoom').show();
    $('#leaveRoom').hide();
    $('#chat').hide();
    $('#roomID').attr('disabled', false);
    for (let socket_id in peers) {
        removePeer(socket_id);
    }
    socket.roomID = null;
    roomID = null;
}


function removePeer(socket_id) {
    let videoEl = document.getElementById(socket_id);
    if (videoEl) {
        const tracks = videoEl.srcObject.getTracks();
        tracks.forEach(function (track) {
            track.stop();
        });

        videoEl.srcObject = null;
        videoEl.parentNode.removeChild(videoEl);
    }
    if (peers[socket_id]) peers[socket_id].destroy();
    delete peers[socket_id];
}


function getRoomID() {
    return roomID;
}


function setRoomID(str) {
    roomID = str;
}
