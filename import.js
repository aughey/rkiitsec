var fs = require('fs');
var csvtojson = require('csvtojson');

csvtojson().fromFile(process.argv[2]).then((json) => {
  console.log(JSON.stringify(json))
})
