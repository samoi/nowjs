var html = require('fs').readFileSync(__dirname + '/index.htm');
var server = require('http').createServer(function (req, res) {
    res.end(html);
});
server.listen(8080);

var nowjs = require("now");
var everyone = nowjs.initialize(server);

console.log("getting: " + everyone);

everyone.now.distributeMessage = function (message) {
    everyone.now.receiveMessage(this.now.name, message);
};

// Create primary key to keep track of all the clients that
// connect. Each one will be assigned a unique ID.
var primaryKey = 0;


// When a client has connected, assign it a UUID. In the
// context of this callback, "this" refers to the specific client
// that is communicating with the server.
//
// NOTE: This "uuid" value is NOT synced to the client; however,
// when the client connects to the server, this UUID will be
// available in the calling context.
everyone.connected(

function () {
    this.now.uuid = ++primaryKey;
});


// Add a broadcast function to *every* client that they can call
// when they want to sync the position of the draggable target.
// In the context of this callback, "this" refers to the
// specific client that is communicating with the server.
everyone.now.syncPosition = function (position) {

    // Now that we have the new position, we want to broadcast
    // this back to every client except the one that sent it in
    // the first place! As such, we want to perform a server-side
    // filtering of the clients. To do this, we will use a filter
    // method which filters on the UUID we assigned at connection
    // time.
    everyone.now.filterUpdateBroadcast(this.now.uuid, position);

};

everyone.now.shall = function (uid) {
    everyone.now.doit(uid);
}

// We want the "update" messages to go to every client except
// the one that announced it (as it is taking care of that on
// its own site). As such, we need a way to filter our update
// broadcasts. By defining this filter method on the server, it
// allows us to cut down on some server-client communication.
everyone.now.filterUpdateBroadcast = function (masterUUID, position) {

    // Make sure this client is NOT the same client as the one
    // that sent the original position broadcast.
    if (this.now.uuid == masterUUID) {

        // Return out of guard statement - we don't want to
        // send an update message back to the sender.
        return;

    }

    // If we've made it this far, then this client is a slave
    // client, not a master client.
    everyone.now.updatePosition(position);

};