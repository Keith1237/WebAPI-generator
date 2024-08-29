require('dotenv').config();
const axios = require('axios');

const coordinates = [
    [79.9588324, 6.5841279],
    [79.9543105, 6.6012196],
    [79.9402208854096, 6.632725402802703],
    [79.928625, 6.6632413],
    [79.91600452486952, 6.6861315430992505],
    [79.9044746, 6.7124685],
    [79.8916572, 6.7429318],
    [79.8859557960341, 6.758490218939393],
    [79.8817806, 6.7743504],
    [79.8755526, 6.786652],
    [79.8727054, 6.7988303],
    [79.8668707, 6.8151872],
    [79.8628581, 6.8312504],
    [79.86214041137703, 6.851076328822256],
    [79.85750975249495, 6.874765314192486],
    [79.8530095, 6.8934809],
    [79.8481929, 6.9113228],
    [79.8496524, 6.9230404],
    [79.84611535510982, 6.932017544891217],
    [79.8500, 6.9337]
  ];
  
async function updateTrainLocation(trainRouteNumber, coordinates) {
    try {
        console.log(`Updating train ${trainRouteNumber} to coordinates: ${coordinates}`);
        const response = await axios.put('http://localhost:3000/trains/updateLocationByNumber', {
            trainRouteNumber: trainRouteNumber,
            coordinates: coordinates,
        });
        console.log(`Response: ${response.data}`);
    } catch (error) {
        console.error(`Failed to update location: ${error.message}`);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data: ${error.response.data}`);
        }
    }
}

function getCurrentLocalTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}.${minutes}`;
}

async function checkDepartureTime(trainRouteNumber) {
    try {
        const response = await axios.get('http://localhost:3000/trains/trainRouteByNumber', {
            params: { trainRouteNumber: trainRouteNumber },
        });

        const trainRoute = response.data;
        const departureTime = trainRoute.departure;
        return getCurrentLocalTime() === departureTime;

    } catch (error) {
        console.error(`Failed to retrieve train route details: ${error.message}`);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data: ${error.response.data}`);
        }
        return false; // Return false if an error occurs
    }
}

async function waitForDepartureTime(trainRouteNumber) {
    while (true) {
        const departureMatched = await checkDepartureTime(trainRouteNumber);
        if (departureMatched) {
            console.log('Departure time reached. Starting train movement.');
            return;
        }
        console.log('Waiting for departure time...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // Check every minute
    }
}

async function run() {
    const trainRouteNumber = "TR005";

    await waitForDepartureTime(trainRouteNumber);

    function* trainGenerator() {
        for (let i = 0; i < coordinates.length; i++) {
            yield coordinates[i];
        }
    }

    const generator = trainGenerator();

    async function moveTrain() {
        const nextStation = generator.next();
        if (!nextStation.done) {
            await updateTrainLocation(trainRouteNumber, nextStation.value);
            setTimeout(moveTrain, 10000); // Move to the next station after 30 seconds
        } else {
            console.log("Train has reached the final destination.");
        }
    }

    moveTrain();
}

run();
