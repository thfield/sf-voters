//TODO add percent of registered voters voting for this candidate

/* init values */
var theMap  = 'data/elect_precincts_combined.topo.json'
var geometry = 'precincts'
var geoClass = 'precinct'
var geoColor
var ballotType = 'Election_Day'

/* global vars for loaded data */
var theData = {}
var mapDict = {}
var pageState = {}
var fullResults

/* page setup */
var width = parseInt(d3.select('#map_container').style('width')),
    height = width,
    active = d3.select(null)

var svg = d3.select("#map_container").append("svg")
    .style('width', width + 'px')
    .style('height', height + 'px');
    // .on("click", stopped, true)

var projection = d3.geo.mercator()
    .center([-122.433701, 37.767683])
    .scale(350 * width)
    .translate([width / 2, height / 2])

var path = d3.geo.path()
    .projection(projection)

var bins = rangeArray(9)
var colorScale = d3.scale.quantize()
colorScale.range(bins)

svg.append("g").attr("class", "legendQuant")
var legend = d3.legend.color()
  .labelFormat(d3.format("f"))
  .useClass(true)
/* end setup */

/* not using zoom yet */
// var zoom = d3.behavior.zoom()
//     .translate([0, 0])
//     .scale(1)
//     .scaleExtent([1, 8])
//     .on("zoom", zoomed)
// function zoomed() {
//   var g = d3.select('#map_container .'+geoClass+'s')
//   g.style("stroke-width", 1 / d3.event.scale + "px")
//   g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")")
// }

/* tooltip dispatcher */
var tt = d3.dispatch('init', 'follow', 'hide')
tt.on('init', function(element){
  d3.select(element).append('div')
      .attr('id', 'tooltip')
      .attr('class', 'hidden')
    .append('span')
      .attr('class', 'value')
})
tt.on('follow', function(element, caption){
  element.on('mousemove', null);
  element.on('mousemove', function() {
    var position = d3.mouse(document.body);
    d3.select('#tooltip')
      .style('top', ( (position[1] + 30)) + "px")
      .style('left', ( position[0]) + "px");
    d3.select('#tooltip .value')
      .text(caption)
  });
  d3.select('#tooltip').classed('hidden', false);
})
tt.on('hide', function(){
  d3.select('#tooltip').classed('hidden', true);
})
tt.init('body')
/* end tooltip dispatcher */

/* ui dispatcher */
var ui = d3.dispatch('clickedGeo', 'mouseOver', 'mouseOut', 'switchCompare', 'switchElection', 'switchBallot', 'switchCandidate')
ui.on('clickedGeo', function(geoId){
})
ui.on('mouseOver', function(d, el) {
  populateInfobox(d.id)
  // var me = d3.select(el),
  // thisText = geoClass + ': ' + d.id
  // return tt.follow(me, thisText)
})
ui.on('mouseOut', function() {
  var table = $('#infobox table')
  table.empty()
})
ui.on('switchCompare', function(){
  var secondCandidate = d3.select('#candidate2')
  secondCandidate.classed("hidden", !secondCandidate.classed("hidden"));
  redrawMap()
})
ui.on('switchElection', function(){
  // read chosen election
  // get data
  redrawMap()
})
ui.on('switchBallot', function(){
  redrawMap()
})
ui.on('switchCandidate', function(){
  redrawMap()
})
/* end ui dispatcher */

var q = d3.queue()
q.defer(d3.json, 'data/all.json')
q.defer(d3.json, theMap)
q.await(onLoad)

function onLoad (error, data, mapdata) {
  if (error) throw error
  fullResults = data
  var resultsSelector = document.getElementById('all-results')
  resultsSelector.innerHTML = ""
  data.map(function (el) { return el.display}).forEach(addOption, resultsSelector)
  setupDropdowns(fullResults[0].display)
  d3.csv('data/all/' + fullResults[0].file, function (error, data) {
    if (error) throw error
    theData = data
    renderMap(mapdata)
  })
}

function setupDropdowns (race) {
  race = raceProperties(race)
  var candidateSelector = document.getElementById('candidates')
  candidateSelector.innerHTML = ""
  race.options.forEach(addOption, candidateSelector)
}

function raceProperties (display) {
  return fullResults.find(function (d) {return d.display === display})
}


function renderMap (map) {
  // mapDict = oneCandidate(theData, "HILLARY_CLINTON", ballotType)
  mapDict = oneCandidate(theData, fullResults[0].options[0], ballotType)
  // var exten = d3.extent(data,function(el){ return +el[defaultProp] })
  //TODO colorScale should be fed extent of voting for both, here and in redrawMap
  var exten = [minOfObjDict(mapDict), maxOfObjDict(mapDict)]
  colorScale.domain(exten)

// debugger
  svg.append('g')
      .attr('class', geoClass + '-container')
    .selectAll('.'+ geoClass)
      .data(topojson.feature(map, map.objects[geometry]).features)
    .enter().append('path')
      // .attr('class', geoClass)
      .attr('d', path)
      .on('click', function(d){ return ui.clickedGeo(d.id) })
      .on('mouseover', function(d){ return ui.mouseOver(d, this) })
      .on("mouseout", ui.mouseOut )
      .attr('class', function(d){
        var obj = mapDict[d.id] || ''
        var colorBin = colorScale(obj)
        if (d.id === undefined) colorBin = 'white'
        return colorBin + ' ' + geoClass + ' ' + geoColor
      })

  legend.scale(colorScale)
  svg.select(".legendQuant")
    .call(legend)
  svg.selectAll('.legendCells .swatch')
    .classed(geoColor, true)
}

function redrawMap () {
  pageState = readPage()
  var exten
  // if (pageState.compare === 'two')
    // exten = [minOfObjDict(mapDict), maxOfObjDict(mapDict)]
  // else
    exten = d3.extent(theData[pageState.party],function(el){ return +el[pageState[pageState.party+'1']] })

  colorScale.domain(exten)

  svg.selectAll('.'+ geoClass)
      .attr('class', function(d){
        var obj = mapDict[d.id] || '-1'
        var colorBin = colorScale(obj)
        if (d.id === undefined) colorBin = 'white'
        return colorBin + ' ' + geoClass + ' ' + geoColor
      })

  legend.scale(colorScale);
  svg.select(".legendQuant")
    .call(legend);
  svg.selectAll('.legendCells .swatch')
    .classed(geoColor, true)
}

// function populateInfobox(precinct) {
//   var data = getFromData(precinct, 'precinct', theData[pageState.party], pageState.ballot)
//   var candidateA = pageState[pageState.party+'1'],
//       candidateB = pageState[pageState.party+'2']
//   var ballot = " in Person"
//   if (pageState.ballot === "both") ballot = " in Total"
//   if (pageState.ballot === "VBM") ballot = " by Mail"
//
//   var table = $('#infobox table')
//   table.empty()
//   table.append('<tr><td>Precinct:</td><td>' + precinct + '</td></tr>')
//   table.append('<tr><td>Registered Voters:</td><td>' + data.registered_voters + '</td></tr>')
//   table.append('<tr><td>Ballots Cast '+ ballot +':</td><td>' + data.ballots_cast + '</td></tr>')
//   table.append('<tr><td>Turnout:</td><td>' + data.turnout + '%</td></tr>')
//   table.append('<tr><td'+ ((pageState.compare === 'two') ?' class="candidateA"':'') +'>Votes for '+ toTitleCase(candidateA.replace(/_/,' ')) +':</td><td>' + data[candidateA] + '</td></tr>')
//   table.append('<tr><td'+ ((pageState.compare === 'two') ?' class="candidateA"':'') +'>% of Votes for '+ toTitleCase(candidateA.replace(/_/,' ')) +':</td><td>' + roundToHundredth(data[candidateA]/data.registered_voters*100) + '%</td></tr>')
//   if (pageState.compare === 'two'){
//     table.append('<tr><td class="candidateB">Votes for '+ toTitleCase(candidateB.replace(/_/,' ')) +':</td><td>' + data[candidateB] + '</td></tr>')
//     table.append('<tr><td'+ ((pageState.compare === 'two') ?' class="candidateB"':'') +'>% of Votes for '+ toTitleCase(candidateB.replace(/_/,' ')) +':</td><td>' + roundToHundredth(data[candidateB]/data.registered_voters*100) + '%</td></tr>')
//   }
// }

function readPage () {
  // read the selected values from the page
  var ballot =  document.querySelector('input[name="ballot-type"]:checked').value
  var candidate = document.getElementById('candidates').value
  var compare //placeholder

  /* set global vars */
  mapDict = oneCandidate(theData, candidate, ballot)

  return {
    compare: compare,
    ballot: ballot,
    candidate: candidate
  }
}

function oneCandidate (data, candidate, ballot) {
  var nested = {}
  if (ballot === 'both'){
    nested = d3.nest()
        .key(function(d) { return d.precinct })
        .rollup(function(p) {
          return d3.sum(p, function(d) { return d[candidate] })
         })
        .map(data)
  } else {
    nested = d3.nest()
      .key(function(d) { return d.precinct })
      .rollup(function(p) {
        //TODO this shouldn't have to sum?
        return d3.sum(p, function(d) { return d.ballot_type === ballot && d[candidate] })
       })
      .map(data)
  }
  return nested
}

// function twoCandidates(data, candidateA, candidateB, ballot) {
//   // returns difference of candidateA-candidateB
//   // candidateA is ".diverging.q8-9"(green), candidateB is ".diverging.q0-9"(purple) in this scale
//   var nested = {}
//   if (ballot === 'both'){
//     nested = d3.nest()
//     .key(function(d) { return d.precinct })
//     .rollup(function(p) { var a =
//       d3.sum(p, function(d) { return d[candidateA] })
//       -
//       d3.sum(p, function(d) { return d[candidateB] })
//       return a
//      })
//     .map(data)
//   } else {
//     var nested = d3.nest()
//       .key(function(d) { return d.precinct })
//       .rollup(function(p) { var a =
//         d3.sum(p, function(d) { return d.ballot_type === ballot && d[candidateA] })
//         -
//         d3.sum(p, function(d) { return d.ballot_type === ballot && d[candidateB] })
//         return a
//        })
//       .map(data)
//   }
//   return nested
// }

function getFromData (id, prop, data, type) {
  var result = {}
  if (type === 'both'){
    var election = data.find(function(el){return +el[prop] === +id && el.ballot_type === "Election_Day"}),
        vbm = data.find(function(el){return +el[prop] === +id && el.ballot_type === "VBM"})
    for (var prop in election){
      result[prop] = election[prop] + vbm[prop]
    }
    result.ballot_type = "both"
    result.precinct = id
    result.registered_voters = election.registered_voters
    result.turnout = roundToHundredth(result.ballots_cast/result.registered_voters*100)
    if (isNaN(result.turnout)) result.turnout = 0
  } else {
    result = data.find(function(el){
      // type can be "Election_Day" or "VBM"
      return +el[prop] === +id && el.ballot_type === type
    })
  }
  return result
}

function preload (obj) {
  for (prop in obj){
    // make sure numbers that were read as strings are changed to numbers
    if(!isNaN(+obj[prop])) obj[prop] = +obj[prop]
    // if a value is an empty string, assume it should be 0
    if(obj[prop] === "") obj[prop] = 0
  }
  return obj
}

function rangeArray (bins) {
  //TODO: i think there is a native d3 function that does this
  var result = [],
      max = bins - 1
  for (var i = 0; i <= max; i++) {
   result.push('q'+ i + '-' + bins);
  }
  return result
}

function minOfObjDict (obj) {
  var result = Object.keys(obj).reduce(function(a, b){ return obj[a] < obj[b] ? a : b });
  return obj[result]
}
function maxOfObjDict (obj) {
  var result = Object.keys(obj).reduce(function(a, b){ return +obj[a] > +obj[b] ? a : b });
  return obj[result]
}
function toTitleCase(str){
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}
function roundToHundredth(num){
  return Math.round(100*num)/100
}
function addOption(el,i, arr){
  /*
  * takes an array of strings and creates an option
  * in the select element passed as 'this' in a forEach call:
  *   var foo = = document.getElementById('foo')
  *   ['bar','baz', 'bar_baz'].foreach(addOption, foo)
  * creates <option value="bar">Bar</option>
  *         <option value="baz">Baz</option>
  *         <option value="bar_baz">Bar Baz</option>
  * inside the existing <select id="foo"></select>
  */
  var option = document.createElement("option")
  option.value = el
  option.text = toTitleCase(el.replace(/_/,' '))
  this.appendChild(option)
}


d3.select(window).on('resize', resize);
function resize() {
  // adjust things when the window size changes
  width = parseInt(d3.select('#map_container').style('width'))
  height = width
  // update projection
  projection
    .translate([width / 2, height / 2])
    .scale(350 * width)
  // resize the map container
  svg
      .style('width', width + 'px')
      .style('height', height + 'px')
  // resize the map
  svg.selectAll('.'+geoClass).attr('d', path);
  // map.selectAll('.state').attr('d', path);
}

/* add listeners to page */
$(".candidate-list").change(ui.switchCandidate)
// $("input[name='compare']").change(function(){ui.switchCompare()})
$("input[name='ballot-type']").change(function(){ui.switchBallot(this.value)})