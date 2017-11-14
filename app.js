const Agenda = require('agenda');
const cronjob = require('./cronjob');
const request = require('request-promise');
const agenda = new Agenda({db: {address: 'mongodb://localhost:27017/applicature'}});

agenda.define('check addresses for new transactions',(job, done) => {
  const db = job.agenda._mdb;
  return cronjob(db).then(done);
});

agenda.on('ready', () => {
  const job = agenda.create('check addresses for new transactions');
  request.get('https://blockchain.info/q/interval')
    .then(Math.ceil)
    .then(interval => {
      job.repeatEvery(`${interval} seconds`).save();
      agenda.start();
    });
});
