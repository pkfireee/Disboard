const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const socketEvents = require('./socket-events');

// An object to store connected clients and their data
const connectedClients = {};

// Serve the static files
app.use('/css', express.static(`${__dirname}/client/css`));
app.use('/js', express.static(`${__dirname}/client/js`));
app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/client/index.html`);
});

// Socket.io connection handler
io.on('connection', (socket) => {
    // At this point a client has connected
    socket.on('username', function(username) {
        socket.username = username;
        console.log(`A client has connected (id: ${socket.id} ${socket.username})`);
        io.emit('is_online', '🔵 <i>' + socket.username + ' joined the chat..</i>');
    });





    if (!(socket.id in connectedClients)) {
        connectedClients[socket.id] = {};
    }

    socket.on('disconnect', () => {
        console.log(`Client disconnected (id: ${socket.id} ${socket.username})`);
        io.emit('is_online', '🔴 <i>' + socket.username + ' left the chat..</i>');
        delete connectedClients[socket.id];
    });

    socket.on('chat_message', function(message) {
        console.log(`Client (id: ${socket.id} ${socket.username}) said: ` + message);
        io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message);
    });

    socket.on(socketEvents.DRAW, (data) => {
        const client = connectedClients[socket.id];

        client.prev = client.curr || data;
        client.curr = data;

        // Emit to all connected clients (including the one who originally sent it)
        io.sockets.emit(socketEvents.DRAW, {
            prev: {
                x: client.prev.x,
                y: client.prev.y,
            },
            curr: {
                x: client.curr.x,
                y: client.curr.y,
            },
            color: client.curr.color,
            thickness: client.curr.thickness,
        });
    });

    socket.on(socketEvents.DRAW_BEGIN_PATH, () => {
        connectedClients[socket.id].curr = null;
    });
});

// Start the server
const port = process.env.PORT || 3000;
http.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
// const port2 = 8080;
// http.listen(port2, () => {
//     console.log(`Listening on port ${port2}`);
// });