const { exec } = require('child_process');

const runScript = (script) => {
  return new Promise((resolve, reject) => {
    exec(`node ${script}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
};

Promise.all([runScript('./CallAPI/matatleUpdateLocation.js'), runScript('./CallAPI/beliattaupdatelocation.js'),runScript('./CallAPI/kalutaraToColombo.js'),runScript('./CallAPI/avissawellaUpdateLocation.js'),runScript('./CallAPI/badullaUpdateLocations')])
  .then((outputs) => {
    console.log('Both scripts finished successfully:', outputs);
  })
  .catch((err) => {
    console.error('Error running scripts:', err);
  });
