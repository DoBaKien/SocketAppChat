const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
const emailSocketMapping = new Map();
const socketEmailMapping = new Map();

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("ic_leave", function (data) {
    console.log("======Left Room========== ");
    console.log(data);

    socket.leave(data, function (err) {
      if (
        typeof io.sockets.adapter.rooms[room1] !== "undefined" &&
        io.sockets.adapter.rooms[room1] != null
      ) {
        console.log(io.sockets.adapter.rooms[room1].length);
        console.log(err);
      } else {
        console.log("room is deleted");
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
  socket.on("forceDisconnect", function () {
    socket.disconnect();
  });
  socket.on("send-notification", (data) => {
    console.log(data);
    socket.to(data.room).emit("new-notification", data);
  });
  socket.on("join-room-call", (data) => {
    const { roomId, emailId } = data;
    console.log("user", emailId, "join", roomId);
    emailSocketMapping.set(emailId, socket.id);
    socketEmailMapping.set(socket.id, emailId);
    socket.join(roomId);
    socket.emit("joined-room-call", { roomId });
    socket.broadcast.to(roomId).emit("joined", { emailId });
  });

  socket.on("call-user", (data) => {
    const { emailId, offer } = data;
    const fromEmail = socketEmailMapping.get(socket.id);
    const socketId = emailSocketMapping.get(emailId);
    socket.to(socketId).emit("incoming-call", { from: fromEmail, offer });
  });

  socket.on("call-accepted", (data) => {
    const { emailId, ans } = data;
    const socketId = emailSocketMapping.get(emailId);
    socket.to(socketId).emit("call-accepted", { ans });
  });
});

server.listen(3002, () => {
  console.log("SERVER RUNNING");
});
