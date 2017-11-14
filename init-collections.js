const { MongoClient } = require('mongodb');
const request = require('request-promise');
const DB_URL = "mongodb://localhost:27017/applicature";

MongoClient.connect(DB_URL, (err, db) => {
  if (err) {
    throw err;
  }
  const createNetworkCollection = () => {
    return db.createCollection('network', {
      max: 1,
      validator: {
        $and: [
          {
            network: {
              $in : ['BITCOIN']
            }
          },
          {
            lastProcessedBlock: {
              $type: 'number'
            }
          }
        ]
      }
    })
      .then(() => request.get('https://blockchain.info/latestblock'))
      .then(JSON.parse)
      .then(block => db.collection('network').insertOne({
        network: 'BITCOIN',
        lastProcessedBlock: Number(block.block_index)
      }));
  };
  const createAddressesCollection = () => {
    return db.createCollection('addresses', {
      autoIndexId: true,
      validator: {
        $and:
         [
            {
              address: { $type: 'string' }
            },
            {
              email: { $type: 'string' },
            },
            {
              user: { $type: 'string' }
            }
         ]
      }
    })
      .then(() => {
        db.collection('addresses').insertOne({
          'address': '1DbQZgYwi7hJ5H3NQowCk7sELNt83GGQsq',
          'email': 'belrestro@gmail.com',
          'user': 'Andrew'
        })
      })
  };

  return Promise.all([createNetworkCollection(), createAddressesCollection()])
    .then(() => {
      console.log('Created successfully');
      return db.close();
    })
});
