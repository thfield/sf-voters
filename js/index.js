/* init values */
var theDataPath = 'data/pres_dem.csv',
    theDataPath2 = 'data/pres_rep.csv',
    theMap  = 'data/elect_precincts_topo.json',
    geometry = 'elect_precincts',
    // theMap  = 'data/sfneighborhoods_topo.json',
    // geometry = 'SFFind_Neighborhoods',
    geoClass = 'precinct',
    geoColor = 'blue',
    defaultProp = 'HILLARY_CLINTON',
    ballotType = 'Election_Day'

/* global vars for loaded data */
var theData = {},
    mapDict = {},
    pageState = {}

var width = 600,
    height = 600,
    active = d3.select(null)

var svg = d3.select("#map_container").append("svg")
    .attr("width", width)
    .attr("height", height)
    // .on("click", stopped, true)

var projection = d3.geo.mercator()
    .center([-122.433701, 37.767683])
    .scale(200000)
    .translate([width / 2, height / 2])

var path = d3.geo.path()
    .projection(projection)

var bins = rangeArray(9)
var colorScale = d3.scale.quantize()
colorScale.range(bins)

svg.append("g")
  .attr("class", "legendQuant")
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
var ui = d3.dispatch('clickedGeo', 'mouseOver', 'mouseOut', 'switchCompare', 'switchParty', 'switchBallot', 'switchCandidate')
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
ui.on('switchParty', function(party){
  var dem = d3.selectAll('.candidates').filter('.dem'),
      rep = d3.selectAll('.candidates').filter('.rep')
  if (party === 'dem'){
    dem.classed("hidden", false)
    rep.classed("hidden", true)
  }
  if (party === 'rep'){
    dem.classed("hidden", true)
    rep.classed("hidden", false)
  }
  redrawMap()
})
ui.on('switchBallot', function(ballot){
  redrawMap()
})
ui.on('switchCandidate', function(){
  redrawMap()
})
/* end ui dispatcher */

var q = d3.queue();
q.defer(d3.json, theMap);
q.defer(d3.csv, theDataPath, preload);
q.defer(d3.csv, theDataPath2, preload);
q.await(renderMap);

function renderMap (error, map, data, data2) {
  if (error) throw error;
  theData.dem = data
  theData.rep = data2
  pageState = readPage()

  var exten = d3.extent(data,function(el){ return +el[defaultProp] })
  colorScale.domain(exten)
  mapDict = oneCandidate(data, defaultProp, ballotType)

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
        return colorBin + ' ' + geoClass + ' ' + geoColor
      })
  //

  legend.scale(colorScale)
  svg.select(".legendQuant")
    .call(legend)
  svg.selectAll('.legendCells .swatch')
    .classed(geoColor, true)
}

function redrawMap(){
  pageState = readPage()

  var exten = [minOfObjDict(mapDict), maxOfObjDict(mapDict)]

  colorScale.domain(exten)

  // redraw the map after the initial rendering
  svg.selectAll('.'+ geoClass)
      .attr('class', function(d){
        var obj = mapDict[d.id] || ''
        var colorBin = colorScale(obj)
        return colorBin + ' ' + geoClass + ' ' + geoColor
      })
  //
  legend.scale(colorScale);
  svg.select(".legendQuant")
    .call(legend);

  svg.selectAll('.legendCells .swatch')
    .classed(geoColor, true)
}

function populateInfobox(precinct) {
  var data = getFromData(precinct, 'precinct', theData[pageState.party], pageState.ballot)
  var candidateA = pageState[pageState.party+'1'],
      candidateB = pageState[pageState.party+'2']
  var ballot = " in Person"
  if (pageState.ballot === "both") ballot = " in Total"
  if (pageState.ballot === "VBM") ballot = " by Mail"

  var table = $('#infobox table')
  table.empty()
  table.append('<tr><td>Precinct:</td><td>' + precinct + '</td></tr>')
  table.append('<tr><td>Registered Voters:</td><td>' + data.registered_voters + '</td></tr>')
  table.append('<tr><td>Ballots Cast '+ ballot +':</td><td>' + data.ballots_cast + '</td></tr>')
  table.append('<tr><td>Turnout:</td><td>' + data.turnout + '%</td></tr>')
  table.append('<tr><td'+ ((pageState.compare === 'two') ?' class="candidateA"':'') +'>Votes for '+ toTitleCase(candidateA.replace(/_/,' ')) +':</td><td>' + data[candidateA] + '</td></tr>')
  if (pageState.compare === 'two')
    table.append('<tr><td class="candidateB">Votes for '+ toTitleCase(candidateB.replace(/_/,' ')) +':</td><td>' + data[candidateB] + '</td></tr>')
}

function readPage() {
  // read the selected values from the page
  var party = document.querySelector('input[name="party"]:checked').value,
      compare = document.querySelector('input[name="compare"]:checked').value,
      ballot =  document.querySelector('input[name="ballot-type"]:checked').value

  var dem1 = document.getElementById('candidate1-d').value,
      dem2 = document.getElementById('candidate2-d').value,
      rep1 = document.getElementById('candidate1-r').value,
      rep2 = document.getElementById('candidate2-r').value

  /* set global vars */
  if (party === 'dem'){
    geoColor = 'blue'
    if (compare === 'two'){
      mapDict = twoCandidates(theData.dem, dem1, dem2, ballot)
      geoColor = 'diverging'
    } else{
      mapDict = oneCandidate(theData.dem, dem1, ballot)
    }
  }
  if (party === 'rep'){
    geoColor = 'red'
    if (compare === 'two'){
      mapDict = twoCandidates(theData.rep, rep1, rep2, ballot)
      geoColor = 'diverging'
    } else{
      mapDict = oneCandidate(theData.rep, rep1, ballot)
    }
  }

  return {
    party: party,
    compare: compare,
    ballot: ballot,
    dem1: dem1,
    dem2: dem2,
    rep1: rep1,
    rep2: rep2
  }
}

function oneCandidate(data, candidate, ballot) {
  //
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

function twoCandidates(data, candidateA, candidateB, ballot) {
  // returns difference of candidateA-candidateB
  // candidateA is ".diverging.q8-9"(green), candidateB is ".diverging.q0-9"(purple) in this scale
  var nested = {}
  if (ballot === 'both'){
    nested = d3.nest()
    .key(function(d) { return d.precinct })
    .rollup(function(p) { var a =
      d3.sum(p, function(d) { return d[candidateA] })
      -
      d3.sum(p, function(d) { return d[candidateB] })
      return a
     })
    .map(data)
  } else {
    var nested = d3.nest()
      .key(function(d) { return d.precinct })
      .rollup(function(p) { var a =
        d3.sum(p, function(d) { return d.ballot_type === ballot && d[candidateA] })
        -
        d3.sum(p, function(d) { return d.ballot_type === ballot && d[candidateB] })
        return a
       })
      .map(data)
  }
  return nested
}

function getFromData(id, prop, data, type) {
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

/* add listeners to page */
$(".candidate-list").change(ui.switchCandidate)
$("input[name='party']").change(function(){ui.switchParty(this.value)})
$("input[name='compare']").change(function(){ui.switchCompare()})
$("input[name='ballot-type']").change(function(){ui.switchBallot(this.value)})