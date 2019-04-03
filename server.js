const MongoClient = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

//connect to mongo
MongoClient.connect('mongodb://127.0.0.1/mongochat', function(err, db){
    if(err){
        throw err;
    }

    var db = db.db('mongochat');
    console.log('Mongodb connected......');
    

    //connect to socket.io
    client.on('connection', function(socket){
        let chat = db.collection('chats');

        //create a function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        //get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            //emit the messages
            socket.emit('output', res);

            //handle input events
            socket.on('input', function(data){
                let name = data.name;
                let message = data.message;

                //check for name and message
                if (name == '' || message == ''){
                    //send an error status
                    sendStatus('please enter a name and message');
                }else{
                    chat.insert({name: name, message:message}, function(){
                        client.emit('output', [data]);

                        //send a status
                        sendStatus({
                            message: 'message sent',
                            clear: true
                        });
                    });
                }
            });
        });
        //handle clear
        socket.on('clear', function(){
            //remove all chats from the collection
            chat.remove({}, function(){
                //emit it to be clear
                socket.emit('cleared');
            });
        });
    });
});