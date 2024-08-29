const { MongoClient } = require('mongodb');
require('dotenv').config();

const coordinates = [
    [79.8500, 6.9337], // Colombo fort
    // Maradana
    [79.865796, 6.9292373],
    // Baseline Road
    [79.8785165, 6.9263756],
    // Cotta Road
    [79.8845653, 6.9133515],
    // Narahenpita
    [79.8779218, 6.8969082],
    // Kirulapone
    [79.88303484206241, 6.88322092332318],
    // Nugegoda
    [79.89107737562675, 6.872345665778746],
    // Pengiriwatte
    [79.90225690155678, 6.864974548892333],
    // Udahamulla
    [79.9087405, 6.8622404],
    // Nawinna
    [79.9179181, 6.8528528],
    // Maharagama
    [79.9271848, 6.8480166],
    // Pannipitiya
    [79.9488784, 6.8473816],
    // Kottawa
    [79.96834246904834, 6.8439898457005635],
    // Malapalle
    [79.97515352129855, 6.844773792615714],
    // Makumbura
    [79.97643168911826, 6.8409265820435845],
    // Homagama Hospital
    [79.9923907, 6.8456611],
    // Homagama
    [80.0042414, 6.8456046],
    // Panagoda
    [80.01902013254147, 6.847132291834024],
    // Godagama
    [80.0328649, 6.8478403],
    // Meegoda
    [80.04624851610451, 6.843654980634093],
    // Watareka
    [80.0598726, 6.8431734],
    // Liyanwala
    [80.0798255, 6.8383764],
    // Padukka
    [80.0912099, 6.8426782],
    // Angampitiya
    [80.10933550952757, 6.853245388960897],
    // Uggalla
    [80.11409822135958, 6.862797431124338],
    // Pinnawala
    [80.1173281, 6.8692902],
    // Gammana
    [80.1231952, 6.8771479],
    // Morakale
    [80.12388887216659, 6.883292032869233],
    // Waga
    [80.1276029, 6.9014119],
    // Kadugoda
    [80.1348493, 6.9180634],
    // Arapanagama
    [80.13479638254178, 6.93243660272495],
    // Kosgama
    [80.137381, 6.9405818],
    // Aluthambalama
    [80.15956901927395, 6.9416486578233405],
    // Miriswatte
    [80.16693060509456, 6.974353075025198],
    // Hingurala
    [80.17166851610891, 6.937065582343047],
    // Puwakpitiya
    [80.1880442, 6.9337144],
    // Puwakpitiya Town
    [80.18745788254182, 6.934300803164934],
    // Kiriwadala
    [80.19631542487055, 6.941191547757661],
    // Avissawella
    [80.2070547, 6.954549]
];

async function updateTrainLocation(db, trainRouteNumber, coordinates) {
    const result = await db.collection('trainroutes').updateOne(
      { trainRouteNumber: trainRouteNumber },
      { $set: { currentLocation: { coordinates: coordinates } } }
    );
    console.log(`Updated train ${trainRouteNumber} to coordinates: ${coordinates}`);
  }
  
  function getCurrentLocalTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}.${minutes}`;
  }
  
  async function checkDepartureTime(db, trainRouteNumber) {
    const trainRoute = await db.collection('trainroutes').findOne({ trainRouteNumber });
    const departureTime = trainRoute.departure;
    return getCurrentLocalTime() === departureTime;
  }
  
  async function waitForDepartureTime(db, trainRouteNumber) {
    while (true) {
      const departureMatched = await checkDepartureTime(db, trainRouteNumber);
      if (departureMatched) {
        console.log('Departure time reached. Starting train movement.');
        return;
      }
      console.log('Waiting for departure time...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Check every minute
    }
  }
  
  async function run() {
    const url = process.env.MONGODB_URI;
    const dbName = 'test';
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
  
    try {
      await client.connect();
      console.log('Connected to MongoDB');
      const db = client.db(dbName);
  
      const trainRouteNumber = "TR004";
  
      await waitForDepartureTime(db, trainRouteNumber);
  
      function* trainGenerator() {
        for (let i = 0; i < coordinates.length; i++) {
          yield coordinates[i];
        }
      }
  
      const generator = trainGenerator();
  
      async function moveTrain() {
        const nextStation = generator.next();
        if (!nextStation.done) {
          await updateTrainLocation(db, trainRouteNumber, nextStation.value);
          setTimeout(moveTrain, 1000); // Move to the next station after 30 seconds
        } else {
          console.log("Train has reached the final destination.");
          await client.close(); // Close the connection only after reaching the final destination
        }
      }
  
      moveTrain();
    } catch (err) {
      console.error(err.stack);
    }
  }
  
  run();