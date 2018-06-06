const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const tp = require('tedious-promises');
const redis = require('redis');
const client = redis.createClient();
const config = require('./config');

tp.setConnectionConfig(config.sqlConfig);

const parseString = (str) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const getProducts = () => {
  return new Promise((resolve, reject) => {
    let productsArr = [];
    const reqStr = 'exec [SP_GetActiveProducts]';
    tp.sql(reqStr)
      .execute()
      .then((results) => {
        for (let i = 0; i < results.length; i++) {
          results[i].nombrecatalogo = parseString(results[i].nombrecatalogo);
          client.lpush('products', JSON.stringify(results[i]))
        }
        resolve();
      })
      .catch(reject);
  })
}

const getProfessions = () => {
  return new Promise((resolve, reject) => {
    let professionsArr = [];
    const reqStr = 'select * from profession'
    tp.sql(reqStr)
      .execute()
      .then((results) => {
        for (let profesion of results) {
          client.lpush('professions', JSON.stringify(profesion));
        }
        resolve();
      })
      .catch(reject);;
  })
}

const getProfessionsCategory = () => {
  return new Promise((resolve, reject) => {
    let professionsArr = [];
    const reqStr = 'select Distinct Category from profession order by Category asc'
    tp.sql(reqStr)
      .execute()
      .then((results) => {
        for (let profession of results) {
          client.lpush('professionsCategory', parseString(profession.Category));
        }
        resolve();
      })
      .catch(reject);
  })
}

Promise.all([getProfessions, getProfessionsCategory, getProducts])
  .then(() => {
    console.log('done')
    process.exit();
  })
  .catch(console.log);


/*** comparacion de tiempos de ejecucion ***/
/* searchProducts = (p) => {
  for (let i = 0; i < p.length; i++) {
    p[i] = JSON.parse(p[i]);
    if (p[i].nombrecatalogo.includes(searchStr)) { }//console.log(p[i].nombrecatalogo)
  }
  // stop counter
  var end = new Date().getTime();
  var time = end - start;
  console.log('Execution time Redis + ES6: ' + time + 'ms');
}
sqlSearchProducts = () => {
  const sqlStr = `select top 5 * from TempProductosActivos a where a.nombrecatalogo like '%${searchStr}%'`;
  tp.sql(sqlStr)
    .execute()
    .then((results) => {
      //console.log(results);
      // stop counter
      var end2 = new Date().getTime();
      var time = end2 - start;
      console.log('Execution time SQL: ' + time + 'ms');
    });
}
var start = new Date().getTime();
var searchStr = 'pis'
sqlSearchProducts();
client.lrange('products', 0, -1, function (err, reply) {
  searchProducts(reply);
}); */
