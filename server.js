const cors = require('cors');
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require("socket.io")(server, {
    path: '/chat/',
    origins: "*:*"
});
const PORT = process.env.PORT||3001;
app.use(cors());

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect('mongodb+srv://dbUser:123@cluster0-rudtc.mongodb.net/test?authSource=admin&replicaSet=Cluster0-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true');
const Message = require('./Schema');
app.get('/', (req, res) => {
    res.sendFile('./build/index.html');
  })
app.get('/db', (req, res) => {
    Message.find({}, (err,message) => {
        if (err) throw err;
        res.json(message)        
    })
})
let online = 0;
io.on('connect', (client) => {    
        console.log("User connected");
        console.log(++online);   
    client.broadcast.emit("change-online", online);
    
    client.on("message", (message) => {
        const newMessage = Message( {  author: client.id, ...message})
       
        client.broadcast.emit("new-message", newMessage);
        console.log(client.id);
        newMessage.save();
        
        });
    client.on("typing", (is) => {
        client.broadcast.emit("somebody-typing", is);
    })

    client.on("disconnect", () => {
        console.log(--online);
        client.broadcast.emit("change-online", online);
        });
});
app.use(express.static('./build/index.html'));
server.listen(PORT, () => (console.log(`server is running on ${PORT}`)));