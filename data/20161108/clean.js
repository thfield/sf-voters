'use strict'
const fs = require('fs')

let dataPath = 'raw/'
let outputPath = 'processed/'

let files = fs.readdirSync(dataPath)

files.map(file=>{
  let fileData = fs.readFileSync(dataPath + file).toString().split('\n')

  let racename = file.replace(/[ |,|-]/g, '')
  let cropto = fileData.findIndex(function(el){
    return /^Grand Totals/.test(el)
  })
  fileData = fileData.splice(3, cropto-3)

  writeToFile(fileData.join('\n'), outputPath + racename )
})

//utility functions
function writeToFile(data, filename){
  fs.writeFile(filename, data, function(err) {
    if(err) {
      console.log('error saving document', err)
    } else {
      console.log('The file was saved as ' + filename)
    }
  })
}
