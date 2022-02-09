OV.ShowAskPermissionDialog = function (room, username, socket_id)
{
    let dialog = new OV.ButtonDialog ();
    let contentDiv = dialog.Init ('New member!', [
        {
            name : 'OK',
            onClick () {
                socket.emit('askPermission', room, username, socket_id, true);
                $('#roomID').attr('disabled', true);
                generate_message(username + ' joined the room', 'self');
                $('#chat-logs-input').css('display', 'revert');
                dialog.Hide ();
            }
        },
        {
            name : 'Cancel',
            subClass : 'outline',
            onClick () {
                dialog.Hide ();
                socket.emit('askPermission', room, username, socket_id, false);
            }
        }

    ]);
    let text = (username + ' wants to join.');
    $('<div>').html (text).addClass ('ov_dialog_section').appendTo (contentDiv);
    dialog.SetCloseable (false);
    dialog.Show ();
    return dialog;
};

OV.ShowAskDeniedPermissionDialog = function ()
{
    let dialog = new OV.ButtonDialog ();
    let contentDiv = dialog.Init ('Permission Denied!', [
        {
            name : 'OK',
            onClick () {
                dialog.Hide ();
            }
        },
    ]);
    let text = ('you are not allowed to join this room!');
    $('<div>').html (text).addClass ('ov_dialog_section').appendTo (contentDiv);
    dialog.SetCloseable (false);
    dialog.Show ();
    return dialog;
};
