window.onload = function() {
  var rollButton = document.getElementById("rollButton");
  rollButton.onclick = Game.takeTurn;

  Game.populateBoard();
};

var Game = (function() {
  var game = {};

  game.squares = [
    new Square("Basset Hound Ave.", 100, "square2"),
    new Square("Great Dane Street", 150, "square3"),
    new Square("Poodle Highway", 200, "square4"),
    new Square("Bull Terrier Way", 250, "square5"),
    new Square("Retriever Road", 300, "square6"),
    new Square("German Shepherd Road", 350, "square7"),
    new Square("Greyhound Gap", 400, "square8"),
    new Square("Whippet Way", 450, "square9"),
    new Square("Labrador Lane", 500, "square10"),
    new Square("Beagle Blvd.", 550, "square11"),
    new Square("Walker Hound Way", 600, "square12")
  ];

  game.players = [
    new Player("Stan", 1000, "Triangle", "player1"),
    new Player("Ike", 1000, "Circle", "player2")
  ];

  game.currentPlayer = 0;

  game.populateBoard = function() {
    this.squares.forEach(function(square) {
      var id = square.squareID;
      document.getElementById(id + "-name").innerHTML = square.name;
      document.getElementById(id + "-value").innerHTML = "$" + square.value;
      document.getElementById(id + "-owner").innerHTML = square.owner;
    });

    var startSquare = document.getElementById("square1-residents");
    game.players.forEach(function(player) {
      player.createToken(startSquare);
    });

    updateByID("player1-info_name", game.players[0].name);
    updateByID("player1-info_cash", game.players[0].cash);
    updateByID("player2-info_name", game.players[1].name);
    updateByID("player2-info_cash", game.players[1].cash);
  };

  game.takeTurn = function() {
    movePlayer();
    checkTile();

    if (game.players[game.currentPlayer].cash < 0) {
      alert("Sorry " + game.players[game.currentPlayer].name + ", you lose!");
    }

    game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
    updateByID("currentTurn", game.players[game.currentPlayer].name);
  };

  function movePlayer() {
    var moves = Math.floor(Math.random() * 4) + 1;
    var totalSquares = game.squares.length + 1;
    var currentPlayer = game.players[game.currentPlayer];
    var currentSquareIndex = parseInt(currentPlayer.currentSquare.slice(6));

    var nextSquareIndex = (currentSquareIndex + moves) % totalSquares;
    if (nextSquareIndex < currentSquareIndex) {
      currentPlayer.updateCash(currentPlayer.cash + 100);
      console.log("$100 for passing start");
    }

    currentPlayer.currentSquare = "square" + nextSquareIndex;
    var currentToken = document.getElementById(currentPlayer.id);
    currentToken.parentNode.removeChild(currentToken);
    currentPlayer.createToken(document.getElementById(currentPlayer.currentSquare));
  }

  function checkTile() {
    var currentPlayer = game.players[game.currentPlayer];
    var currentSquareObj = game.squares.find(function(square) {
      return square.squareID === currentPlayer.currentSquare;
    });

    if (currentPlayer.currentSquare === "square1") {
      currentPlayer.updateCash(currentPlayer.cash + 100);
      updateByID("messagePara", currentPlayer.name + ": You landed on start. Here's an extra $100");
    } else if (currentSquareObj.owner === "For Sale") {
      if (currentPlayer.cash < currentSquareObj.value) {
        updateByID("messagePara", currentPlayer.name + ": Sorry, you can't afford to purchase this property");
        return;
      }

      if (confirm(currentPlayer.name + ": This property is unowned. Would you like to purchase this property for $" + currentSquareObj.value + "?")) {
        currentSquareObj.owner = currentPlayer.id;
        currentPlayer.updateCash(currentPlayer.cash - currentSquareObj.value);
        updateByID("messagePara", currentPlayer.name + ": you now have $" + currentPlayer.cash);
        updateByID(currentSquareObj.squareID + "-owner", "Owner: " + game.players[game.currentPlayer].name);
      }
    } else if (currentSquareObj.owner === currentPlayer.id) {
      updateByID("messagePara", currentPlayer.name + ": You own this property. Thanks for visiting!");
    } else {
      updateByID("messagePara", currentPlayer.name + ": This property is owned by " + currentSquareObj.owner + ". You owe $" + currentSquareObj.rent + ". You now have $" + currentPlayer.cash);
      var owner = game.players.find(function(player) {
        return player.id === currentSquareObj.owner;
      });
      currentPlayer.updateCash(currentPlayer.cash - currentSquareObj.rent);
    }
  }

  function updateByID(id, msg) {
    document.getElementById(id).innerHTML = msg;
  }

  function Square(name, value, squareID) {
    this.name = name;
    this.value = value;
    this.rent = value * 0.3;
    this.squareID = squareID;
    this.owner = "For Sale";
  }

  function Player(name, cash, token, id) {
    this.name = name;
    this.cash = cash;
    this.token = token;
    this.id = id;
    this.currentSquare = "square1";
  }

  Player.prototype.createToken = function(square) {
    var playerSpan = document.createElement("span");
    playerSpan.setAttribute("class", this.token);
    playerSpan.setAttribute("id", this.id);
    square.appendChild(playerSpan);
  };

  Player.prototype.updateCash = function(amount) {
    document.getElementById(this.id + "-info_cash").innerHTML = amount;
    this.cash = amount;
  };

  return game;
})();
