const express = require('express');
const app = express();
const http = require('http');
const https = require('https');
const fs = require('fs');

const options = {
    cert: fs.readFileSync(`./cert.pem`),
    key: fs.readFileSync(`./key.pem`)
};

const PORT = process.env.PORT || 3001;

const server = https.createServer(options, app);

let users = []

const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});


io.on('connection', (socket) => {

    socket.on('disconnect', function () {
        const admin = users.filter(obj => (obj.socketid === socket.id) && (obj.admin === true));
        const user = users.filter(obj => (obj.socketid === socket.id));
        let room;
        let username;
        if (admin.length > 0) {
            room = admin[0]["room"];
            username = admin[0]["name"];
            socket.to(room).emit('removeAll', room, username);

            socket.leave(room);
            users.splice(users.findIndex(({socketid}) => socketid == socket.id), 1);
        } else if (user.length > 0) {
            room = user[0]["room"];
            username = user[0]["name"];
            socket.to(room).emit('leave', room, username);

            socket.leave(room);
            users.splice(users.findIndex(({socketid}) => socketid == socket.id), 1);
        }
    });

    socket.on('join', function (room, username, modelName) {
        const admin = users.filter(obj => (obj.admin === true) && (obj.room === room));


        if (admin.length > 0) {
            // Not Admin, simple members
            if (admin[0]['socket'].connected) {
                const admin = users.filter(obj => (obj.admin === true) && (obj.room === room));
                socket.emit('askPending');
                socket.to(admin[0]['socketid']).emit('askPermission', room, username, socket.id);
                users.push({
                    'socketid': socket.id,
                    'socket': socket,
                    'name': username,
                    'admin': false,
                    'room': room,
                    'modelname': modelName,
                });
            } else {
                users.splice(admin.findIndex(({socket_id}) => socket_id == admin[0]['socketid']), 1);
                users.push({
                    'socketid': socket.id,
                    'socket': socket,
                    'name': username,
                    'admin': true,
                    'room': room,
                    'modelname': modelName
                });
                socket.join(room);
                socket.emit('newJoined', true, socket.id);
            }

        } else {
            // Admin
            users.push({
                'socketid': socket.id,
                'socket': socket,
                'name': username,
                'admin': true,
                'room': room,
                'modelname': modelName
            });

            socket.join(room);

            socket.emit('newJoined', true, socket.id);


        }
    });

    socket.on('askPermission', function (room, username, socket_id, status) {
        if (status) {
            const admin = users.filter(obj => (obj.socketid === socket.id) && (obj.admin === true) && (obj.room === room));
            const newUser = users.filter(obj => (obj.socketid === socket_id) && (obj.room === room));
            const allUsers = users.filter(obj => (obj.room === room));

            if (((admin[0]['modelname'] !== undefined) || (admin[0]['modelname'] !== '')) && ((newUser[0]['modelname'] !== undefined) || (newUser[0]['modelname'] !== ''))) {
                const adminModel = admin[0]['modelname'];

                if (admin[0]['modelname'] !== newUser[0]['modelname']) {
                    socket.to(socket_id).emit('loadModel', adminModel);
                }
            }

            newUser[0]['socket'].join(room);

            socket.to(socket_id).emit('newJoined', true, socket.id);


            for (let i = 0; i < allUsers.length; i++) {
                if (allUsers[i]['socketid'] == newUser[0]['socketid']) continue
                newUser[0]['socket'].emit('initReceive', allUsers[i]['socketid']);
            }

        } else {
            try {
                const newUser = users.filter(obj => (obj.socketid === socket_id) && (obj.room === room));
                socket.to(newUser[0]['socketid']).emit('permissionDenied');
                users.splice(users.findIndex(({socket_id}) => socket_id == newUser[0]['socketid']), 1);
            } catch (e) {
            }

        }
    });

    /**
     * Send message to client to initiate a connection
     * The sender has already setup a peer connection receiver
     */
    socket.on('initSend', (init_socket_id) => {
        socket.to(init_socket_id).emit('initSend', socket.id);
    });

    socket.on('updatePostion', (data) => {
        socket.to(data.room).emit('updatePostion', data);
    });

    /**
     * relay a peerconnection signal to a specific socket
     */
    socket.on('signal', (data) => {
        // console.log('sending signal from ' + socket.id + ' to ', data)
        // if (!peers[data.socket_id]) return
        socket.to(data.socket_id).emit('signal', {
            socket_id: socket.id,
            signal: data.signal,
            room: data.room
        });
    });

    socket.on('leave', (room, username) => {
        const admin = users.filter(obj => (obj.socketid === socket.id) && (obj.admin === true) && (obj.room === room));
        if (admin.length > 0) {
            socket.to(room).emit('removeAll', room, username);
            const allUsers = users.filter(obj => (obj.room === room));
            for (let i = 0; i < allUsers.length; i++) {
                allUsers[i]['socket'].leave(room);
                users.splice(users.findIndex(({socketid}) => socketid == allUsers[i]['socketid']), 1);
            }
        } else {
            socket.to(room).emit('leave', room, username);
            socket.leave(room);
            users.splice(users.findIndex(({socketid}) => socketid == socket.id), 1);
        }

    });

    // Chat
    socket.on('chat', (room, username, message) => {
        socket.to(room).emit('chat', username, message);
    });

    // Load 3D Model for all participants
    socket.on('loadModel', (room, model) => {
        if (room !== null) {
            socket.to(room).emit('loadModel', model);
            let admin = users.filter((obj => obj.room == room && obj.admin === true));
            admin[0]['modelname'] = model;
        }
    });

    // Mouse and touch for chaning 3D model position
    socket.on('on3DMouseDownReceiver', (ev_object) => {
        socket.to(ev_object.room).emit('on3DMouseDownReceiverFunc', ev_object);
    });

    socket.on('on3DMouseWheelReceiver', (ev_object) => {
        socket.to(ev_object.room).emit("on3DMouseWheelReceiverFunc", ev_object);
    });

    socket.on('on3DTouchStartReceiver', (ev_object) => {
        socket.to(ev_object.room).emit("on3DTouchStartReceiverFunc", ev_object);
    });
    socket.on('on3DTouchMoveReceiver', (ev_object) => {
        socket.to(ev_object.room).emit("on3DTouchMoveReceiverFunc", ev_object);
    });
    socket.on('on3DTouchEndReceiver', (ev_object) => {
        socket.to(ev_object.room).emit("on3DTouchEndReceiverFunc", ev_object);
    });

    socket.on('on3DMouseMoveReceiver', (ev_object) => {
        socket.to(ev_object.room).emit("on3DMouseMoveReceiverFunc", ev_object);
    });


    socket.on('on3DMouseUpReceiver', (ev_object) => {
        socket.to(ev_object.room).emit("on3DMouseUpReceiverFunc", ev_object);
    });

    socket.on('on3DMouseLeaveReceiver', (ev_object) => {
        socket.to(ev_object.room).emit("on3DMouseLeaveReceiverFunc", ev_object);
    });
});

server.listen(PORT, () => console.log(`Socket Server is listening on port ${PORT}`))
