//hold all restaurant data in an array of objects
var resturant = [
        {'name': 'Mcdonalds', 'address': '4100 Baldwin St S, Whitby, ON L1R 3H8', 'lat': 43.9176059, 'long':-78.96039999999999 },
        {'name': 'KFC', 'address': '25 Thickson Rd N, Whitby, ON L1N 8W8', 'lat': 43.8885267, 'long':-78.91286739999998 },
        {'name': 'Mary Brown', 'address': '4150 Baldwin St S, Whitby, ON L1R 3H8', 'lat': 43.917373, 'long':-78.947268 },
        {'name': 'Dairy Queen', 'address': '3975 Garden St #3, Whitby, ON L1R 3A4', 'lat': 43.917373, 'long':-78.9468081 },
        {'name': 'Toppers Pizza', 'address': '3500 Brock St N, Whitby, ON L1R 3J4', 'lat': 43.9069794, 'long':-78.95476400000001 },
];

//create a class to hold each instance of a resturant
var resturantMarker = function(data){
  //store each resturants name + address + long + lat + rating
  this.name = data.name;
  this.address = data.address;
  this.lat = data.lat;
  this.long = data.long;
  this.rating = 0;
  //create a map marker
  this.mapMarkerStart = function(){ return new google.maps.Marker({
        position: {lat: this.lat, lng: this.long},
        title: this.name
      });
  };
  //store map marker with click listener
  this.map_marker = {};

  //cheak if rating exisits and draw map marker
  this.ratingCheck = function(){
    var that = this;
    if(that.rating === 0){
      this.zomato(function(msg){
        var marker = that.mapMarkerStart();
        if(typeof msg === 'object' && typeof msg.restaurants[0].restaurant !== undefined){
          that.rating = msg.restaurants[0].restaurant.user_rating.aggregate_rating;
          marker.addListener('click', function() {
            infoWindow.setContent(that.name + "'s Zomato Rating: " + that.rating);
            selected(marker);
          });
          that.map_marker = marker;
          markers.push(marker);
          drawMarker();
        }else if(msg === 'Rating not found'){
          that.rating = msg;
          marker.addListener('click', function() {
            infoWindow.setContent(that.name + "'s Zomato Rating: " + that.rating);
            selected(marker);
          });
          that.map_marker = marker;
          markers.push(marker);
          drawMarker();
        }else {
          that.rating = 'Resturant not found';
          marker.addListener('click', function() {
            infoWindow.setContent(that.name + "'s Zomato Rating: " + that.rating);
            selected(marker);
          });
          that.map_marker = marker;
          markers.push(marker);
          drawMarker();
        }
      });
    }else{
        markers.push(this.map_marker);
        drawMarker();
    }
  };

  //call to zomato API to get resturant ratings
  this.zomato = function(callback){
    $.ajax({
    url: "https://developers.zomato.com/api/v2.1/search",
    headers: {"user-key": "c07774caffe1a2305423c2bd1137a886"},
    data: {lat: this.lat, lon: this.long, q: this.name},
    success: function(msg){
        callback(msg);
    },
    error: function( msg ) {
        console.log(msg);
        callback('Rating not found');
    }
    });
  };
};

//KnockoutJS viewmodel
var myViewModel = function() {
  var self = this;

  //Variable to store text from inputbox
  this.resturant_search_name = ko.observable("");

  //Original list of resturants
  this.resturant_list = ko.observableArray([]);

  //List of filtered resturanst based on user input
  this.filtered_resturant = ko.observableArray([]);

  //list of map markers
  this.markers = ko.observableArray([]);

  //add resturant information from model to array
  resturant.forEach(function(info){
      self.resturant_list.push(new resturantMarker(info));
  });

  //filter resturants based on user input
  this.resturants = ko.computed(function() {
    //serach terms
    var search = this.resturant_search_name();

    //check if resurant name contains search term
    function filterResturant(resturant){
       return resturant.name.toLowerCase().includes(search.toLowerCase());
    }

    //add resturant to list if it contains search term
    this.filtered_resturant(this.resturant_list().filter(filterResturant));
  }, this);

  //watches for changes to restaurant list on userinput and updates markers
  this.filtered_resturant.subscribe(function(){
    //clear old markers
    clearMarkers();
  });

  //On google map API load draw map and add markers
  this.initMap = function(){
    //inital map area focus
    this.home = {lat: 43.90613, lng: -78.93163400000003};

    //create map
    this.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 13,
      center: this.home
    });

    //create info window object
    this.infoWindow = new google.maps.InfoWindow();
    //add marker
    addMarker();
  };

  //handle map loading error
  this.mapError = function(){
    var map = $('#map');
    map.text("We were unable to load the map, please try refreshing the window");
  };

  this.addMarker =function() {
    //for every resturant in filtered list add a map marker
    for(var i = 0; i < this.filtered_resturant().length; i++){
     this.filtered_resturant()[i].ratingCheck();
    }
  };

  this.drawMarker = function() {
      //for every map marker draw it on the map
    for (var i = 0; i < this.markers().length; i++) {
      this.markers()[i].setMap(map);
    }
  };

  this.clearMarkers = function() {
    //when list of markers has changed delete all old markers
    for (var i = 0; i < this.markers().length; i++) {
      this.markers()[i].setMap(null);
    }
    this.markers([]);

    //add/draw markers in new list
    addMarker();
  };

  this.clicks = function(thisone){
    google.maps.event.trigger(thisone.map_marker, 'click');
  };

  //open infowindow and animate when marker is selected and close all other infowindows and stop animations
  this.selected = function(marker, info){
    for(var i = 0; i < markers().length; i++){
      markers()[i].setAnimation(null);
      infoWindow.close();
    }
    marker.setAnimation(google.maps.Animation.BOUNCE);
    infoWindow.open(map, marker);
  };
};

//init Knockout
ko.applyBindings(myViewModel);