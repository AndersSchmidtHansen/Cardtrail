'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var cameraSupport = navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

new Vue({
  el: '#app',
  data: {
    splashOpen: true,
    lat: null,
    lng: null,
    mapURL: null,
    camera: null,
    stream: null,
    cameraOpen: false,
    position: {
      title: 'The Old Pumps'
    },
    icons: {
      base: {
        icon: './images/icons/base.png'
      },
      point_of_interest: {
        icon: './images/icons/poi.png'
      }
    }
  },
  methods: {
    openCamera: function openCamera() {
      var vm = this;

      this.cameraOpen = true;
      navigator.getUserMedia({
        audio: false,
        video: {
          width: 100,
          height: 180
        }
      }, function onSuccess(stream) {
        vm.stream = stream;
        vm.camera = document.getElementById('Camera');
        vm.camera.src = window.URL.createObjectURL(stream);
        vm.camera.onloadedmetadata = function (event) {
          vm.camera.play();
        };

        vm.canvas = document.getElementById('canvas');
        vm.context = vm.canvas.getContext('2d');
      }, function onFailure() {});
    },
    closeCamera: function closeCamera() {
      var vm = this;
      if (this.cameraOpen) {
        var tracks = [].concat(_toConsumableArray(vm.stream.getAudioTracks()), _toConsumableArray(vm.stream.getVideoTracks()));

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = tracks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var track = _step.value;

            track.stop();
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        vm.camera.pause();
        vm.camera.src = '';
        vm.cameraOpen = false;
      }
    },
    collect: function collect() {
      this.context.drawImage(this.camera, 0, 0, 175, 175);
      this.camera.src = this.canvas.toDataURL('image/png');
    }
  },
  ready: function ready() {
    var vm = this;

    if (!navigator.geolocation || !cameraSupport) {
      alert('No support dude');
      return;
    }

    /*
    let progressBar = document.getElementById('ProgressBar');
    progressBar.addEventListener('webkitAnimationEnd', function() {
      vm.splashOpen = false;
    });
    */

    pubs();

    function onSuccess(position) {
      var locationMarker = null;
      var MAPTYPE_ID = 'cardtrail';

      vm.lat = position.coords.latitude;
      vm.lng = position.coords.longitude;

      if (locationMarker) {
        return;
      }

      var here = new google.maps.LatLng(vm.lat, vm.lng);
      var infowindow = new google.maps.InfoWindow();

      var map = new google.maps.Map(document.getElementById('Map'), {
        center: {
          lat: vm.lat,
          lng: vm.lng,
          alt: 0
        },
        zoom: 8,
        disableDoubleClickZoom: true,
        fullscreenControl: false,
        keyboardShortcuts: false,
        maxZoom: 18,
        minZoom: 18,
        panControl: false,
        scrollWheel: false,
        streetViewControl: false,
        scaleControl: false,
        zoomControl: false,
        mapTypeControl: false,
        disableDefaultUI: true,
        mapTypeControlOptions: {
          mapTypeIds: [google.maps.MapTypeId.SATELLITE, MAPTYPE_ID]
        },
        mapTypeId: MAPTYPE_ID
      });

      var MapTypeStyle = [{ "featureType": "all", "elementType": "labels", "stylers": [{ "visibility": "off" }] }, { "featureType": "landscape", "elementType": "all", "stylers": [{ "visibility": "on" }, { "color": "#f3f4f4" }] }, { "featureType": "landscape.man_made", "elementType": "geometry", "stylers": [{ "weight": 0.9 }, { "visibility": "off" }] }, { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "visibility": "on" }, { "color": "#83cead" }] }, { "featureType": "road", "elementType": "all", "stylers": [{ "visibility": "on" }, { "color": "#ffffff" }] }, { "featureType": "road", "elementType": "labels", "stylers": [{ "visibility": "off" }] }, { "featureType": "road.highway", "elementType": "all", "stylers": [{ "visibility": "on" }, { "color": "#fee379" }] }, { "featureType": "road.arterial", "elementType": "all", "stylers": [{ "visibility": "on" }, { "color": "#fee379" }] }, { "featureType": "water", "elementType": "all", "stylers": [{ "visibility": "on" }, { "color": "#7fc8ed" }] }];

      var cardtrailMapType = new google.maps.StyledMapType(MapTypeStyle, {
        name: 'Cardtrail'
      });

      map.mapTypes.set(MAPTYPE_ID, cardtrailMapType);
      map.setTilt(45);

      var marker = new google.maps.Marker({
        position: {
          lat: vm.lat,
          lng: vm.lng
        },
        map: map,
        icon: vm.icons.base.icon,
        animation: google.maps.Animation.DROP
      });

      var request = {
        location: here,
        radius: '2000',
        types: ['point_of_interest']
      };

      var service = new google.maps.places.PlacesService(map);
      service.nearbySearch(request, callback);

      function callback(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          for (var i = 0; i < results.length; i++) {
            var place = results[i];
            createMarker(results[i]);
          }
        }
      }

      function createMarker(place) {
        var placeLoc = place.geometry.location;
        var marker = new google.maps.Marker({
          map: map,
          icon: vm.icons.point_of_interest.icon,
          position: place.geometry.location
        });

        google.maps.event.addListener(marker, 'click', function () {
          vm.position.title = place.name;
          vm.openCamera();
        });
      }

      function redraw() {
        console.info('lat', position.coords.latitude);
        console.info('lng', position.coords.longitude);
        map.setCenter({ lat: position.coords.latitude, lng: position.coords.longitude, alt: 0 });
        marker.setPosition({ lat: position.coords.latitude, lng: position.coords.longitude, alt: 0 });
      }

      setInterval(redraw, 5000);

      // EVENTS
      google.maps.event.addListener(map, 'tilesloaded', function () {
        //
      });
    }

    function onFailure() {
      console.warn('Unable to retrieve location');
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onFailure, {
      enableHighAccuracy: true
    });

    function pubs() {
      var pubnub = PUBNUB.init({
        publish_key: 'pub-c-e6aba8f0-7ac0-44c6-9790-157af357ac60',
        subscribe_key: 'sub-c-4be5f3b8-5044-11e6-85a4-0619f8945a4f'
      });

      pubnub.subscribe({
        channel: 'mymaps',
        message: function message(_message, channel) {
          console.log(_message);
          lat = _message.lat;
          lng = _message.lng;
          redraw();
        },
        connect: function connect() {
          console.log('PubNub Connected');
        }
      });
    }
  }
});