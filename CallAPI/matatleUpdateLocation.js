require('dotenv').config();
const axios = require('axios');

const coordinates = [[79.8500, 6.9337], // Colombo fort
[79.8651, 6.9295], // Maradana
[79.8792, 6.9375], // Dematagoda
[79.8945, 6.9611], // Kalaniya
[79.8992, 6.9757], // Wanawasala
[79.9004, 6.9876], // Hunupitiya
[79.9069, 7.0003], // Ederamulla
[79.9311, 7.0471], // Walpola
[79.9372, 7.0551], // Batuwaththa
[79.9456, 7.0661], // Bulugahagoda
[79.9600, 7.0686], // Ganemulla
[79.9738, 7.0747], // Yagoda
[79.9937, 7.0935], // Gampaha
[80.0205, 7.1224], // Bemmulla
[80.0586, 7.1528], // Veyangoda
[80.0661, 7.1676], // Wadurawa
[80.0900, 7.1987], // Pallewela
[80.1051, 7.2129], // Ganegoda
[80.1267, 7.2425], // Meerigama
[80.1352, 7.2563], // Wilwatta
[80.1532, 7.2567], // Botale
[80.1693, 7.2561], // Ambepussa
[80.1944, 7.2705], // Yaththalgoda
[80.2386, 7.2933], // Alawwa
[80.2691, 7.3138], // Walakumbura
[80.3006, 7.3308], // Polgahawela Junction
[80.3643, 7.3185], // Yatagama
[80.3902, 7.3213], // Rambukkana
[80.4335, 7.3180], // Kadigamuwa
[80.4546, 7.2962], // Gangoda
[80.4694, 7.2886], // Ihala Kotte
[80.4964, 7.2618], // Bambaragala
[80.5208, 7.2578], // Kadugannawa
[80.5526, 7.2669], // Pilimatalawa
[80.5930, 7.2682], // Barammane
[80.5830, 7.2674], // Kiribathkumbura
// Peradeniya Junction
[80.5893918, 7.2556021],
// Sarasavi Uyana
[80.59660133169928, 7.259953990913845],
// Rajawatte
[80.59652783850572, 7.259916553720924],
// Randles Hill
[80.61814278953052, 7.278767910878854],
// Suduhumpola
[80.62599000529967, 7.284726265924983],
// Kandy
[80.63220374745472, 7.289858902410831],
// Mahiyawa
[80.63496177163196, 7.30228367504927],
// Katugastota Road
[80.63300816905205, 7.330383357858954],
// Mavilmada
[80.63087387144307, 7.31907133429891],
// Katugastota
[80.6331868, 7.3304389],
// Pallethalawinna
[80.64128711329509, 7.337965530238853],
// Udathalawinna
[80.65116539244218, 7.339605228818319],
// Meegammana
[80.6670587, 7.3404456],
// Yatirawana
[80.67826729670708, 7.345171921553916],
// Wattegama
[80.6824572, 7.3506962],
// Yatawara
[80.66993665296275, 7.3650324542305725],
// Marukona
[80.64673144249437, 7.4045332552023595],
// Udaththawala
[80.642042, 7.411504],
// Ukuwela
[80.6341866, 7.4205065],
// Tawalankoya
[80.63091791159297, 7.431546021621553],
// Elwala
[80.6321344, 7.4416745],
// Kohobiliwala
[80.63091688686622, 7.4315938187594375],
// Matale
[80.6249611, 7.467978]
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
    const trainRouteNumber = "TR003";

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
