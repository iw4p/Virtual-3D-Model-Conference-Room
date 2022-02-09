OV.ShowSocketDialog = function ()
{
    let dialog = new OV.ButtonDialog ();
    let contentDiv = dialog.Init ('Network Issue', [
        {
            name : 'OK',
            onClick () {
                dialog.Hide ();
            }
        }
    ]);

    let text = 'There is an issue with your network.\nPlease try again.';
    $('<div>').html (text).addClass ('ov_dialog_section').appendTo (contentDiv);
    dialog.SetCloseable (false);
    dialog.Show ();
    return dialog;
};
