const request = require('request-promise');
const _ = require('lodash');
const { MongoClient } = require('mongodb');

module.exports = async function job(db) {
  const addressesCollection = db.collection('addresses');
  const networkCollection = db.collection('network');
  const addresses = await addressesCollection.find({}).toArray();
  const latestBlock = await networkCollection.findOne({});

  const getBlock = (hash) => {
    return request.get(`https://blockchain.info/rawblock/${hash}`)
    .then(JSON.parse)
  }
  const getTransactionsWithAdresses = (tx, store) => {
    _.forEach(tx, transaction => {
      const participants = _.filter(addresses, participant => {
        return _.some(transaction.out, out => out.addr === participant.address);
      });
      _.forEach(participants, participant => {
        const address = participant.address;
        const newTx = store[address] || (store[address] = []);
        const txData = _.pick(transaction, ['tx_index', 'hash']);
        newTx.push(txData);
      });
    });
  };
  async function getPreviousTransactionsWithAdress(startHash, endIndex) {
    const txList = {};
    let block = await getBlock(startHash);

    while (block.block_index !== endIndex) {
      currentHash  = block.prev_block;
      [block] = await Promise.all([getBlock(currentHash), getTransactionsWithAdresses(block.tx, txList)]);
    }
    return txList;
  }

  request.get('https://blockchain.info/latestblock')
    .then(JSON.parse)
    .then(({hash: latestHash, block_index: latestIndex}) => {
      const lastRecordedIndex = latestBlock.lastProcessedBlock;
      return getPreviousTransactionsWithAdress(latestHash, lastRecordedIndex)
        .then(list => {
          if (_.isEmpty(list)) {
            return console.log('Everything is up to date');
          }
          const mailer = require('./mailer');

          _.forEach(list, (items, key) => {
            const participant = _.find(addresses, {address : key});
            const mailOptions = {
              email: participant.email,
              subject: 'Transaction blockchain.info update',
              html: `<p>${participant.user}, you've got new transactions with your account</p>
              <ul>
              ${_.map(items, item => `<li><a href="https://blockchain.info/ru/rawtx/${item.hash}">${item.tx_index}</a></li>`)}
              </ul>`
            };
            mailer.sendMail(mailOptions)
          });
        })
        .then(() => {
          return networkCollection.findOneAndUpdate({}, {
            network: 'BITCOIN',
            lastProcessedBlock: Number(latestIndex)
          }, {upsert: true});
        })
    })
};
