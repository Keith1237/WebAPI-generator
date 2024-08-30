require('dotenv').config({ path: '../.env' });
const axios = require('axios');

const trainRouteURL = `${process.env.BACKEND_URL}/trains`;
console.log(trainRouteURL);  

const coordinates =[
    [79.8500, 6.9337],
    [79.84611535510982, 6.932017544891217],
    [79.8496524, 6.9230404],
    [79.8481929, 6.9113228],
    [79.8530095, 6.8934809],
    [79.85750975249495, 6.874765314192486],
    [79.86214041137703, 6.851076328822256],
    [79.8628581, 6.8312504],
    [79.8668707, 6.8151872],
    [79.8727054, 6.7988303],
    [79.8755526, 6.786652],
    [79.8817806, 6.7743504],
    [79.8859557960341, 6.758490218939393],
    [79.8916572, 6.7429318],
    [79.9044746, 6.7124685],
    [79.91600452486952, 6.6861315430992505],
    [79.928625, 6.6632413],
    [79.9402208854096, 6.632725402802703],
    [79.9543105, 6.6012196],
    [79.9588324, 6.5841279],
    [79.9659991, 6.5601827],
    [79.9749255, 6.5316754],
    [79.97895436904717, 6.521797246964418],
    [79.9814557, 6.5048663],
    [79.9836883, 6.4768931],
    [79.9907635, 6.4578453],
    [80.0002675, 6.4323352],
    [79.9966032, 6.4221857],
    [80.0087108, 6.3874272],
    [ 80.01424300194124,6.364653409055769],
    [80.0294246, 6.3385525],
    [80.0336688, 6.3293476],
    [80.0376852, 6.3127647],
    [80.0396724556352, 6.297037077282814],
    [80.04345217100844, 6.277029663107115],
    [80.046979, 6.2663183],
    [80.0529491, 6.250272],
    [80.0550417, 6.2353149],
    [80.0613096, 6.2122502],
    [80.0648773, 6.1921065],
    [80.0740547, 6.1832231],
    [80.0889326, 6.1691433],
    [80.09474093836074, 6.158787796810267],
    [80.1001719, 6.1420637],
    [80.1144287, 6.1223772],
    [80.124281, 6.1123699],
    [80.1329228, 6.0982524],
    [80.1400164, 6.0933353],
    [80.1610723, 6.0738123],
    [80.1792993, 6.0608932],
    [79.4266122, 43.8747978],
    [80.21433185370307, 6.033390257447812],
    [80.2402032, 6.0327634],
    [80.2491475, 6.0220278],
    [80.2801641, 5.9985775],
    [80.307301, 5.9940796],
    [80.33161285185336, 5.986150360033703],
    [80.3403702825385, 5.9828265132155645],
    [80.36382309603148, 5.973467211524015],
    [80.3915605, 5.965211],
    [80.4096807248671, 5.963908104799982],
    [80.42953343651074, 5.97589608686959],
    [80.457268, 5.9645666],
    [80.4735043, 5.9567029],
    [80.49577973836013, 5.9437028344878],
    [80.51421225370274, 5.945678143253514],
    [80.54350926719576, 5.952088111014588],
    [80.55667926719589, 5.95393743907726],
    [80.57898265863025, 5.960340793702314],
    [80.60119343651066, 5.961174081290624],
    [80.66111247868344, 5.972544545558019],
    [80.69829521676554, 5.982815903777266],
    [80.72399658162058, 6.002623701056805],
    [80.7370394, 6.0422815]
  ];
async function updateTrainLocation(trainRouteNumber, coordinates) {
    try {
        console.log(`Updating train ${trainRouteNumber} to coordinates: ${coordinates}`);
        const response = await axios.put(`${trainRouteURL}/updateLocationByNumber`, {
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
        const response = await axios.get(`${trainRouteURL}/trainRouteByNumber`, {
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
    const trainRouteNumber = "TR002";

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
