function randomNumber(len) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    for( let i=1; i <= len; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    if (i % 3 === 0 && i !== len) {
        text += '-';
    }}
    return text;
}

// when the client push down Enter
function submitButton(inputID, buttonID) {
    let input = document.getElementById(inputID);
    // Execute a function when the user releases a key on the keyboard
    input.addEventListener('keyup', (event) => {
    // Number 13 is the "Enter" key on the keyboard
    if (event.key === 'Enter') {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        document.getElementById(buttonID).click();
    }
    });
}

function roomIDParamHandler(param) {
    return new URLSearchParams(window.location.search).get(param);
}



function HTTPtoHTTPS() {
    //todo: fix http to https
    console.log('http to https');
    if (location.protocol !== 'https:') {
        location.replace(`https:${location.href.substring(location.protocol.length)}`);
    }
}

