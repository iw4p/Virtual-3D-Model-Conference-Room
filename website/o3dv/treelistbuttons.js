// website object
let website_ = null;
//todo
let modelName = 'Tester_Case';

function getPaging(name) {
    modelName = name;
    if (isJoinedInsideRoom) {
        socket.emit('loadModel', roomID, modelName);
    }
    website_.LoadModel(modelName);
    // Remove extra tree view button
    $('#toolbar > div > div:nth-child(1)').remove();
}

// // make li s Clickable
// $(() => {
//     $('li').css('cursor', 'pointer')
//         .click(function () {
//             window.location = $('a', this).attr('href');
//             return false;
//         });
// });
