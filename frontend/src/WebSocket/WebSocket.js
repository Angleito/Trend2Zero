// WebSocket FFI for PureScript

exports._newWebSocket = function(url) {
  return function() {
    return new WebSocket(url);
  };
};

exports._close = function(socket) {
  return function() {
    socket.close();
  };
};

exports._send = function(socket) {
  return function(message) {
    return function() {
      socket.send(message);
    };
  };
};

exports._readyState = function(socket) {
  return function() {
    return socket.readyState;
  };
};

exports._url = function(socket) {
  return function() {
    return socket.url;
  };
};

exports._onOpen = function(socket) {
  return function(handler) {
    return function() {
      socket.onopen = function(event) {
        handler(event)();
      };
    };
  };
};

exports._onClose = function(socket) {
  return function(handler) {
    return function() {
      socket.onclose = function(event) {
        handler(event)();
      };
    };
  };
};

exports._onMessage = function(socket) {
  return function(handler) {
    return function() {
      socket.onmessage = function(event) {
        handler(event.data)();
      };
    };
  };
};

exports._onError = function(socket) {
  return function(handler) {
    return function() {
      socket.onerror = function(event) {
        handler(event)();
      };
    };
  };
};

// ReadyState constants
exports.connectingState = WebSocket.CONNECTING;
exports.openState = WebSocket.OPEN;
exports.closingState = WebSocket.CLOSING;
exports.closedState = WebSocket.CLOSED;