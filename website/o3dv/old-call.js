
        // Call Funcs

        function answerCallFunc(id) {
            callAccepted = true;

            const peer = new SimplePeer({initiator: false, trickle: false, stream});

            peer.on('signal', (data) => {
                socket.emit('answercall', {signal: data, to: call.from});
                $('#endCall').show();
            });

            peer.on('stream', (currentStream) => {
                document.getElementById('userVideo').srcObject = currentStream;
            });

            peer.signal(call.signal);

            // connectionRef.current = peer;
            connectionRef = peer;
        }

        function callUser(id) {

            id = $('#callID').val();
            socket.calluserID = id;

            const peer = new SimplePeer({initiator: true, trickle: false, stream});

            peer.on('signal', (data) => {
                me = socket.id;
                socket.emit('calluser', {userToCall: id, signalData: data, from: me, name});
                $('#endCall').show();
            });

            peer.on('stream', (currentStream) => {
                document.getElementById('userVideo').srcObject = currentStream;
            });

            socket.on('callaccepted', (signal) => {
                callAccepted = true;
                peer.signal(signal);
            });

            // connectionRef.current = peer;
            connectionRef = peer;
        }

        function leaveCall() {
            $('#answerCall').hide();
            $('#endCall').hide();


            callEnded = true;
            // connectionRef.current.destroy();
            connectionRef.destroy();

            window.location.reload(); //reload and change userID
        }


        // Voice Call Function

        /*
        navigator.mediaDevices.getUserMedia({video: false, audio: true})
            .then((currentStream) => {
                stream = currentStream;
                document.getElementById("myVideo").srcObject = currentStream;
            });
        */

                
        // socket.on('me', (id) => setMe(id));
        //socket.on('mee', function(id) {
        //    me = id;
        //});

        socket.on('calluser', ({from, name: callerName, signal}) => {
            call = {isReceivedCall: true, from, name: callerName, signal};
            $('#answerCall').show();
        });

        // $(document).ready(function(){

        // });