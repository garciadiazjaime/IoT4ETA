//////// Customize this data! /////////
//
var startpoint = "Merchandise Mart, Chicago, Illinois, United States"; // Commute starting address
var endpoint = "722 Hinman Ave, Evanston, Illinois, United States"; // Commute ending address
var trafficlowthreshold = 1; // If traffic adds 3 min. or less to commute, traffic is "low."
var traffichighthreshold = 2; // If traffic adds 10 min. or more to commute, traffic is "high." If traffic adds between 3 and 10 minutes to commute, traffic is "medium."
var refreshrate = 1; // Traffic data is updated every 5 minutes.
//
///////////////////////////////////////

// Set up Photon

var Particle = require("particle-api-js");
var particle = new Particle();
particle.login({ username: myparticleemail, password: myparticlepw });

// Set up Bing Maps API and traffic data

var http = require("http");
var url = "http://dev.virtualearth.net/REST/V1/Routes/Driving?wp.0=" + startpoint + "&wp.1=" + endpoint + "&key=" + mybingmapskey
var triplength,
    normallength,
    trafficrating;

// Get traffic estimate from Bing Maps API and publish to Photon

function getTraffic() {
  console.log('getTraffic');
    var request = http.get(url, function (response) {
        var buffer = "",
            data;
        response.on("data", function (chunk) { buffer += chunk; });
        response.on("end", function (err) {
            data = JSON.parse(buffer);

            // Compare route with and without current traffic delays to determine traffic rating (low, med, high)

            triplength = data.resourceSets[0].resources[0].travelDurationTraffic / 60;
            normallength = data.resourceSets[0].resources[0].travelDuration / 60;
            console.log('triplength', triplength, 'normallength', normallength);
            if (normallength + trafficlowthreshold >= triplength) {
                console.log("Little to no traffic! Your journey should take " + Math.round(triplength) + " minutes.");
                trafficrating = "low";
            }
            else if (normallength + trafficlowthreshold < triplength && normallength + traffichighthreshold > triplength) {
                console.log("Moderate traffic! Your journey should take " + Math.round(triplength) + " minutes.");
                trafficrating = "med";
            }
            else if (normallength + traffichighthreshold <= triplength) {
                console.log("Heavy traffic! Your journey should take " + Math.round(triplength) + " minutes.");
                trafficrating = "high";
            }

            // Publish traffic rating to Photon

            var publishEventPr = particle.publishEvent({ name: 'traffic', data: trafficrating, auth: myparticletoken });
            publishEventPr.then(
                function (data) {
                    console.log("Publishing to Photon...", data);
                },
                function (err) {
                    console.log("Failed to publish event. :(", err);
                }
            );
        });
    });
}
getTraffic();

// Refresh and republish

setInterval(getTraffic, [refreshrate * 60 * 1000]);
