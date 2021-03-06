//TODO add percent of registered voters voting for this candidate

/* init values */
var theMap  = 'data/elect_precincts_nov.topo.json'
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
  var secondCandidate = d3.select('#secondCandidate')
  secondCandidate.classed("hidden", !secondCandidate.classed("hidden"));
  redrawMap()
})
ui.on('switchElection', function(){
  var election = electionProperties(document.getElementById('election-selector').value)
  setupDropdowns(election.display)
  d3.csv('data/20161108/processed/' + election.file, function (error, data) {
    if (error) throw error
    theData = data
    redrawMap()
  })
})
ui.on('switchBallot', function(){
  redrawMap()
})
ui.on('switchCandidate', function(){
  redrawMap()
})
/* end ui dispatcher */

var q = d3.queue()
q.defer(d3.json, 'data/nov2016.json')
q.defer(d3.json, theMap)
q.await(onLoad)

function onLoad (error, data, mapdata) {
  if (error) throw error
  fullResults = data
  var electionSelector = document.getElementById('election-selector')
  electionSelector.innerHTML = ""
  fullResults.map(function (el) { return el.display}).forEach(addOption, electionSelector)
  setupDropdowns(fullResults[0].display)
  d3.csv('data/20161108/processed/' + fullResults[0].file, function (error, data) {
    if (error) throw error
    theData = data
    renderMap(mapdata)
  })
}

function setupDropdowns (election) {
  election = electionProperties(election)
  geoColor = election.color
  var candidateSelectors = [document.getElementById('candidate-selector'),document.getElementById('second-candidate-selector')]
  candidateSelectors.forEach(function (selector,i) {
    selector.innerHTML = ""
    election.options.forEach(addOption, selector)
    selector.value = selector.options[i].value
  })
}

function electionProperties (display) {
  return fullResults.find(function (d) {return d.display === display})
}

function renderMap (map) {
  mapDict = oneCandidate(theData, fullResults[0].options[0], ballotType)
  //TODO colorScale should be fed extent of voting for both, here and in redrawMap
  var exten = [minOfObjDict(mapDict), maxOfObjDict(mapDict)]
  colorScale.domain(exten)

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
  pageState = readPage()
}

function redrawMap () {
  pageState = readPage()

  var exten = [minOfObjDict(mapDict), maxOfObjDict(mapDict)]
  colorScale.domain(exten)

  svg.selectAll('.'+ geoClass)
      .attr('class', function(d){
        var obj = mapDict[d.id] || '-1'
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

function populateInfobox (precinct) {
  var data = getFromData(precinct, 'PrecinctID', theData, pageState.ballot)
  var candidate =pageState.candidate
  var candidateB = pageState.candidate2
  var ballot = " in Person"
  if (pageState.ballot === "both") ballot = " in Total"
  if (pageState.ballot === "VBM") ballot = " by Mail"

  var table = $('#infobox table')
  table.empty()
  table.append('<tr><td>Precinct:</td><td>' + precinct + '</td></tr>')
  table.append('<tr><td>Registered Voters:</td><td>' + data.Registration + '</td></tr>')
  table.append('<tr><td>Ballots Cast '+ ballot +':</td><td>' + data["Ballots Cast"] + '</td></tr>')
  table.append('<tr><td>Turnout:</td><td>' + data["Turnout (%)"] + '%</td></tr>')
  table.append('<tr><td'+ ((pageState.compare === 'two') ?' class="candidateA"':'') +'>Votes for '+ toTitleCase(candidate.replace(/_/,' ')) +':</td><td>' + ((data[candidate]==="") ? '0' : data[candidate]) + '</td></tr>')
  table.append('<tr><td'+ ((pageState.compare === 'two') ?' class="candidateA"':'') +'>% of Votes for '+ toTitleCase(candidate.replace(/_/,' ')) +':</td><td>' + roundToHundredth(data[candidate]/data.Registration*100) + '%</td></tr>')
  if (pageState.compare === 'two'){
    table.append('<tr><td class="candidateB">Votes for '+ toTitleCase(candidateB.replace(/_/,' ')) +':</td><td>' + ((data[candidateB]==="") ? '0' : data[candidateB]) + '</td></tr>')
    table.append('<tr><td'+ ((pageState.compare === 'two') ?' class="candidateB"':'') +'>% of Votes for '+ toTitleCase(candidateB.replace(/_/,' ')) +':</td><td>' + roundToHundredth(data[candidateB]/data.Registration*100) + '%</td></tr>')
  }
}

function readPage () {
  // read the selected values from the page
  var ballot =  document.querySelector('input[name="ballot-type"]:checked').value
  var candidate = document.getElementById('candidate-selector').value
  var candidate2 = document.getElementById('second-candidate-selector').value
  var election = document.getElementById('election-selector').value
  var compare = document.querySelector('input[name="compare"]:checked').value

  /* set global vars */
  if (compare === 'two') {
    mapDict = twoCandidates(theData, candidate, candidate2, ballot)
    geoColor = 'diverging'
  } else {
    mapDict = oneCandidate(theData, candidate, ballot)
    geoColor = electionProperties(election).color
  }

  return {
    compare: compare,
    ballot: ballot,
    candidate: candidate,
    candidate2: candidate2,
    election: election
  }
}

function oneCandidate (data, candidate, ballot) {
  var nested = {}
  if (ballot === 'both'){
    nested = d3.nest()
        .key(function(d) { return d.PrecinctID })
        .rollup(function(p) {
          return d3.sum(p, function(d) { return d[candidate] })
         })
        .map(data)
  } else {
    nested = d3.nest()
      .key(function(d) { return d.PrecinctID })
      .rollup(function(p) {
        //TODO this shouldn't have to sum?
        return d3.sum(p, function(d) { return d.ReportingType === ballot && d[candidate] })
       })
      .map(data)
  }
  return nested
}

function twoCandidates(data, candidateA, candidateB, ballot) {
  // returns difference of candidateA-candidateB
  // candidateA is ".diverging.q8-9"(green), candidateB is ".diverging.q0-9"(purple) in this scale
  var nested = {}
  if (ballot === 'both'){
    nested = d3.nest()
    .key(function(d) { return d.PrecinctID })
    .rollup(function(p) { var a =
      d3.sum(p, function(d) { return +d[candidateA] })
      -
      d3.sum(p, function(d) { return +d[candidateB] })
      return a
     })
    .map(data)
  } else {
    var nested = d3.nest()
      .key(function(d) { return d.PrecinctID })
      .rollup(function(p) { var a =
        d3.sum(p, function(d) { return d.ReportingType === ballot && d[candidateA] })
        -
        d3.sum(p, function(d) { return d.ReportingType === ballot && d[candidateB] })
        return a
       })
      .map(data)
  }
  return nested
}

function getFromData (id, prop, data, type) {
  var result = {}
  if (type === 'both'){
    var election = data.find(function(el){return el[prop] === id && el.ReportingType === "Election Day"}),
        vbm = data.find(function(el){return el[prop] === id && el.ReportingType === "VBM"})
    for (var prop in election){
      result[prop] = +election[prop] + +vbm[prop]
    }
    result.ReportingType = "both"
    result.PrecinctID = id
    result.Registration = election.Registration
    result["Turnout (%)"] = roundToHundredth(result["Ballots Cast"]/result.Registration*100)
    if (isNaN(result["Turnout (%)"])) result["Turnout (%)"] = 0
  } else {
    result = data.find(function(el){
      // type can be "Election Day" or "VBM"
      return el[prop] === id && el.ReportingType === type
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
$("#election-selector").change(ui.switchElection)
$(".candidate-list").change(ui.switchCandidate)
$("input[name='compare']").change(function(){ui.switchCompare()})
$("input[name='ballot-type']").change(function(){ui.switchBallot(this.value)})

/* add help tooltips to page */
var helpTextElection = 'Choose the election'
var helpTextCompare = 'Choose One to show the results for a single candidate or Two to show the difference between two candidates (candidate 1 - candidate 2)'
var helpTextBallot = 'Choose Election Day to show those ballots cast in person, Vote by Mail to show those cast by mail, or Both to show the sum of the two categories'
var helpTextSecondCandidate = 'The second candidate: votes will be subtracted from the first'
$('#tt-election-selector').tooltip({placement:'top', title: helpTextElection})
$('#tt-compare-selector').tooltip({placement:'top', title: helpTextCompare})
$('#tt-ballot-type-selector').tooltip({placement:'top', title: helpTextBallot})
$('#tt-second-candidate').tooltip({placement:'top', title: helpTextSecondCandidate})

