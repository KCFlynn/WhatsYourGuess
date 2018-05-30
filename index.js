window.onload = function () {

    userArray.length = 0;  // clear array
    
    $(document).on('click', '#ButtonBet', function(event){
        buttonClicked();
    });

    $(document).on('click', '#create', function(event){
      addNewUser();ButtonQuit
    }); 

    $(document).on('click', '#bet1', function(event){
        state.current_betAmount = 1;
        document.location.href = "#game";
    });
    
    $(document).on('click', '#bet2', function(event){
        state.current_betAmount = 2;
        document.location.href = "#game";
    });
    $(document).on('click', '#bet5', function(event){
        state.current_betAmount = 5;
        document.location.href = "#game";
    });

    $(document).on('click', '#ButtonQuit', function(event){
        quit();
    });

    $(document).on("pagebeforeshow", "#pickplayer",function(event){
        createList();
    });
 
    $(document).on("pagebeforeshow", "#PickBet",function(event){
        var which = $('#IDparmHere').text();  // get the full name out of the hidden HTML
        state.current_fullName = which;
        setCurrent_index(which); // get pointer in our array of users based on fullname
        // force the mongo dollar amount to an int, not a string
        state.current_balance = parseInt(userArray[state.current_index].MongoBalance);
        var x = "Welcome " + state.current_fullName  + " You have $" + state.current_balance;
        $('#welcome').text(x);
    });


    $(document).on("pagebeforeshow", "#game",function(event){
        document.getElementById("turnCount").innerText = 0;
        document.getElementById("balance").innerText = state.current_balance;
        document.getElementById("status").innerText = "Good luck!";
        document.getElementById("ButtonBet").style.visibility = 'visible';
    });

     // set up an event, if user clicks any, it writes that items data-parm into the hidden html 
    $(document).on('click', '.onePlayer', function(event){
        //$('.onePlayer').on("click", function (event) {    // this worked first time through, but not second!!
        var parm = $(this).attr("data-parm");  // passing in the fullname
        //write that fullname value into the  pickbet page
        $('#IDparmHere').text(parm);
    });

} // end of window.onload


//=====================================================================
// functions not required to be in window.onload

var state = {
    current_index: 999,  // these values better get set before we use them
    current_balance: 20.20,
    current_betAmount: 0,
    current_fullName: "?"
}

// store PlayerObject objects here
var userArray = [];

// define a constructor to create player objectsPlayerFirstName
// this object gets used to pass up to mongo, but when we get the mongo
// data back and store in the local array, it has the added primary key added
var PlayerObject = function(pFirstName, pLastName, pBalance) {
 this.MongoFirstName = pFirstName;
 this.MongoLastName = pLastName;
 this.MongoBalance = (pBalance * 10)/10;
}

function createList() {
    // first load array from Mongo
    // jQuery AJAX call for JSON
    $.getJSON( '/users/userlist', function( data ) {
        userArray.length = 0;  // clear array
        userArray = data;
        // For each item in our JSON, add an element in our local array
  
        // this code has to be in the getJSON callback function, since it uses data that is not valid until it completes
        $('#playerul').empty(); // don't want to keep adding old li s to old li s
        userArray.forEach(function(element) {
            var fullName = element.MongoFirstName + "_" + element.MongoLastName
            $('#playerul').append('<li><a data-transition="pop" class="onePlayer" data-parm=' + 
                fullName + ' href="#PickBet" > Pick your bet size.  ' + 
                fullName + ' </a></li>' );
        });
    $('#playerul').listview('refresh');
    });
};


function addNewUser(){
    // ajax call to mongo
    // Use AJAX to post the object to our adduser service
    var newUser = new PlayerObject( $('#firstName').val(), $('#lastName').val(), 10)
    $.ajax({
        type: 'POST',
        data: newUser,
        url: '/users/adduser',
        dataType: 'JSON'
    }).done(function( response ) {
        if (response.msg === '') {
            // Clear the form inputs
            $('#firstName').val('');
            $('#lastName').val('');
            document.location.href = "#pickplayer"; // move the html back to the pickplayer sub-page
        }
        else {
            // If something goes wrong, alert the error message that our service returned
            alert('Error: ' + response.msg);
        }
    });
};

function buttonClicked() {
    state.current_balance = GetNewBalance(state.current_balance);  // run one cycle of the game
    (document.getElementById("balance")).innerText = (state.current_balance).toString();
    if(state.current_balance <= 0) {
        (document.getElementById("ButtonBet")).style.visibility = 'hidden';
        setCurrent_index(state.current_fullName); // shouldn't need to do this, as the  state.current_index should still be accurate
        state.currentFullName = ""; 
        state.current_balance = userArray[state.current_index].PlayerBalance = 0.0;
        // delete them from Mongo rigth here
        deleteuser();
        document.location.href = "index.html#LosePage";  // take player to lose page
    }
    if(state.current_balance >= 20.0) {
        state.current_balance = userArray[state.current_index].PlayerBalance = 10.0;  // set player back to $10
        document.location.href = "index.html#WinPage";
    }
};

function GetNewBalance(balance) {
 var dice = [];
 RollDice(dice);
 var dice1txt = "images/dice-" + dice[0] + ".jpg";
 var dice2txt = "images/dice-" + dice[1] + ".jpg";
 document.getElementById("image1").src = dice1txt;
 document.getElementById("image2").src = dice2txt;
 if (dice[0] == dice[1] || dice[0] + dice[1] == 7 || dice[0] + dice[1] == 11) {
     balance = balance + state.current_betAmount;
     (document.getElementById("status")).innerText = "You Win!";
 }
 else {
     balance = balance - state.current_betAmount;
     (document.getElementById("status")).innerText = "You Lost!";
 }

 
 var turnCount = (document.getElementById("turnCount")).innerText;
 var turnCountInt = parseInt(turnCount);
 turnCountInt++;
 (document.getElementById("turnCount")).innerText = turnCountInt;

 return balance;
}

function RollDice(dice) {
 dice[0] = Math.floor((Math.random() * 6) + 1);
 dice[1] = Math.floor((Math.random() * 6) + 1);
}  

function quit(){
        var playerBalance = parseInt(state.current_balance);
    var userID = userArray[state.current_index]._id;
    
    $.ajax({
    type: 'PUT',
    url: '/users/updateuser/' + userID + '*' + playerBalance  // passsing 2 arguements as one
    }).done(function( response ) {
      
      if (response.msg === '') {
        
            document.location.href = "#pickplayer"; // move the html back to the pickplayer sub-page
        }
        else {
            // If something goes wrong, alert the error message that our service returned
            alert('Error: ' + response.msg);
        }
    });
    document.location.href = "#Home";
}
      /* setCurrent_index(state.current_fullName)
    var userID = userArray[state.current_index]._id;
    // pass up the full name, deal with splitting on the server
       $.ajax({
        type: 'PUT',
        url: '/users/updateuser/' + userID
    }).done(function( response ) {
        if (response.msg === '') {
        
            document.location.href = "#pickplayer"; // move the html back to the pickplayer sub-page
        }
        else {
            // If something goes wrong, alert the error message that our service returned
            alert('Error: ' + response.msg);
        }
    });
    
    document.location.href = "#Home";
}*/

function setCurrent_index(fullName) {
    var pointer = 0;
    userArray.forEach(function(element) {
        if( (userArray[pointer].MongoFirstName + "_" + userArray[pointer].MongoLastName) == fullName )  {
            state.current_index = pointer;
            return;
        }
        else {
            pointer++;
            state.current_index = -1; // indicates bug in code
        }
    });
};


function deleteuser() {
    setCurrent_index(state.current_fullName)
    var userID = userArray[state.current_index]._id;
    // pass up the full name, deal with splitting on the server
       $.ajax({
        type: 'DELETE',
        url: '/users/deleteplayer/' + userID
      }).done(function( response ) {
          // Check for a successful (blank) response
        if (response.msg === '') {
        }
        else {
          alert('Error: ' + response.msg);
        }
    });
  }
