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
    new Square("Walker Hound Way", 600, "square12"),
    new Square("Go to Jail", 0, "square13", true),
    new Square("Free Parking", 0, "square14", false, "Free Parking Bonus")
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
      document.getElementById(id + "-value").innerHTML = square.value ? "$" + square.value : "N/A";
      document.getElementById(id + "-owner").innerHTML = square.owner ? "Owner: " + square.owner : "For Sale";
      if (square.houses) updateByID(id + "-houses", square.houses + " houses");
      if (square.hotels) updateByID(id + "-hotels", square.hotels + " hotels");
      if (square.special) updateByID(id + "-special", square.special);
    });

    var startSquare = document.getElementById("square1-residents");
    game.players.forEach(function(player) {
      player.createToken(startSquare);
    });

    updateByID("player1-info_name", game.players[0].name);
    updateByID("player1-info_cash", game.players[0].cash);
    updateByID("player2-info_name", game.players[1].name);
    updateByID("player2-info_cash", game.players[1].cash);
    updateByID("currentTurn", game.players[game.currentPlayer].name);
  };

  game.takeTurn = function() {
    movePlayer();
    checkTile();

    if (game.players[game.currentPlayer].cash < 0) {
      handleBankruptcy();
    }

    game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
    updateByID("currentTurn", game.players[game.currentPlayer].name);
  };

  game.startAuction = function(squareID) {
    var square = this.squares.find(s => s.squareID === squareID);
    if (square.owner === "For Sale") {
        var highestBid = 0;
        var highestBidder = null;

        game.players.forEach(function(player) {
            var bid = prompt(player.name + ", enter your bid for " + square.name + " (Current highest: $" + highestBid + "):");
            if (bid && bid > highestBid) {
                highestBid = bid;
                highestBidder = player;
            }
        });

        if (highestBidder) {
            highestBidder.cash -= highestBid;
            square.owner = highestBidder.id;

            updateByID(highestBidder.id + "-info_cash", highestBidder.cash);
            updateByID(squareID + "-owner", "Owner: " + highestBidder.name);
            updateByID("messagePara", highestBidder.name + " won the auction for " + square.name + " with a bid of $" + highestBid);
        } else {
            updateByID("messagePara", "No bids placed for " + square.name);
        }
    } else {
        updateByID("messagePara", "This property is not up for auction.");
    }
};


game.tradeProperty = function(playerFrom, playerTo, squareID, cashOffer) {
  var square = this.squares.find(s => s.squareID === squareID);
  if (square.owner === playerFrom.id && playerTo.cash >= cashOffer) {
      square.owner = playerTo.id;
      playerFrom.cash += cashOffer;
      playerTo.cash -= cashOffer;

      updateByID(playerFrom.id + "-info_cash", playerFrom.cash);
      updateByID(playerTo.id + "-info_cash", playerTo.cash);
      updateByID(squareID + "-owner", "Owner: " + playerTo.name);
      updateByID("messagePara", playerTo.name + " bought " + square.name + " from " + playerFrom.name + " for $" + cashOffer);
  } else {
      updateByID("messagePara", "Trade cannot be completed. Either the property is not owned by " + playerFrom.name + " or " + playerTo.name + " doesn't have enough cash.");
  }
};


game.buyHouseOrHotel = function(player, squareID) {
  var square = this.squares.find(s => s.squareID === squareID);
  if (square.owner === player.id) {
      var cost = square.value * 0.5;
      if (player.cash >= cost) {
          square.houses = (square.houses || 0) + 1;
          player.cash -= cost;

          updateByID(player.id + "-info_cash", player.cash);
          updateByID(squareID + "-houses", square.houses + " houses");
          updateByID("messagePara", player.name + " bought a house on " + square.name);
      } else {
          updateByID("messagePara", player.name + " doesn't have enough cash to buy a house.");
      }
  } else {
      updateByID("messagePara", player.name + " doesn't own this property.");
  }
};


game.mortgageProperty = function(player, squareID) {
  var square = this.squares.find(s => s.squareID === squareID);
  if (square.owner === player.id) {
      var mortgageValue = square.value / 2;
      player.cash += mortgageValue;
      square.isMortgaged = true;

      updateByID(player.id + "-info_cash", player.cash);
      updateByID(squareID + "-owner", "Owner: Mortgaged by " + player.name);
      updateByID("messagePara", player.name + " mortgaged " + square.name + " for $" + mortgageValue);
  } else {
      updateByID("messagePara", player.name + " doesn't own this property.");
  }
};


  function movePlayer() {
    var moves = Math.floor(Math.random() * 4) + 1;
    var totalSquares = game.squares.length;
    var currentPlayer = game.players[game.currentPlayer];
    var currentSquareIndex = parseInt(currentPlayer.currentSquare.slice(6));

    var nextSquareIndex = (currentSquareIndex + moves) % totalSquares;
    if (nextSquareIndex < currentSquareIndex) {
      currentPlayer.updateCash(currentPlayer.cash + 100);
      updateByID("messagePara", currentPlayer.name + " passed Go and received $100!");
    }

    if (game.squares[nextSquareIndex].special === "Free Parking Bonus") {
      currentPlayer.updateCash(currentPlayer.cash + 200);
      updateByID("messagePara", currentPlayer.name + " landed on Free Parking and received a $200 bonus!");
    }

    if (game.squares[nextSquareIndex].special === "Go to Jail") {
      currentPlayer.currentSquare = "square13";
      updateByID("messagePara", currentPlayer.name + " has been sent to Jail!");
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

    if (currentSquareObj.special) return;

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
      owner.updateCash(owner.cash + currentSquareObj.rent);
    }
  }

  function handleBankruptcy() {
    var currentPlayer = game.players[game.currentPlayer];
    alert("Sorry " + currentPlayer.name + ", you are bankrupt!");
    currentPlayer.currentSquare = "square1";
    updateByID("player1-info_cash", 1000);
  }

  function updateByID(id, msg) {
    document.getElementById(id).innerHTML = msg;
  }

  function Square(name, value, squareID, special, specialMessage) {
    this.name = name;
    this.value = value;
    this.rent = value * 0.3;
    this.squareID = squareID;
    this.owner = "For Sale";
    this.houses = 0;
    this.hotels = 0;
    this.special = special || null;
    this.specialMessage = specialMessage || "";
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

  Player.prototype.buyHouse = function(squareID) {
    var square = game.squares.find(s => s.squareID === squareID);
    if (this.cash >= 50 && square.owner === this.id) {
      this.cash -= 50;
      square.houses += 1;
      updateByID(this.id + "-info_cash", this.cash);
      updateByID(squareID + "-houses", square.houses + " houses");
    }
  };

  Player.prototype.buyHotel = function(squareID) {
    var square = game.squares.find(s => s.squareID === squareID);
    if (this.cash >= 200 && square.houses >= 4 && square.owner === this.id) {
      this.cash -= 200;
      square.houses -= 4;
      square.hotels += 1;
      updateByID(this.id + "-info_cash", this.cash);
      updateByID(squareID + "-houses", square.houses + " houses");
      updateByID(squareID + "-hotels", square.hotels + " hotels");
    }
  };

  Player.prototype.mortgageProperty = function(squareID) {
    var square = game.squares.find(s => s.squareID === squareID);
    if (square.owner === this.id) {
      this.cash += square.value / 2;
      square.owner = "For Sale";
      updateByID(this.id + "-info_cash", this.cash);
      updateByID(squareID + "-owner", "Owner: For Sale");
    }
  };

  return game;
})();
