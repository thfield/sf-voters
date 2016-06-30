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
    mapDict = {}

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
tt.on('follow', function(element, caption, options){
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
var ui = d3.dispatch('clickedGeo', 'mouseOver', 'switchCompare', 'switchParty', 'switchBallot', 'switchCandidate')
ui.on('clickedGeo', function(geoId){
})
ui.on('mouseOver', function(d, el) {
  var me = d3.select(el),
  thisText = geoClass + ': ' + d.id
  return tt.follow(me, thisText)
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

function redrawMap(){
  var options = readPage()
  //which ballotType?
  //how many candidates?
  //  if 2, twoCandidates()
  //  else continue
  //which candidate(s)

  var cand
  if (options.party === 'dem') {
    if (options.compare === 'two'){
      mapDict = twoCandidates(theData.dem, options.dem1, options.dem2, options.ballot)
      geoColor = 'diverging'
    }else{
      mapDict = oneCandidate(theData.dem, options.dem1, options.ballot)
      geoColor = 'blue'
    }
  }
  if (options.party === 'rep') {
    if (options.compare === 'two'){
      mapDict = twoCandidates(theData.rep, options.rep1, options.rep2, options.ballot)
      geoColor = 'diverging'
      }
    else{
      mapDict = oneCandidate(theData.rep, options.rep1, options.ballot)
      geoColor = 'pink'
    }
  }



  var exten = [minOfObjDict(mapDict), maxOfObjDict(mapDict)]
// debugger;
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

function readPage() {
  // read the selected values from the page
  var party = document.querySelector('input[name="party"]:checked').value,
      compare = document.querySelector('input[name="compare"]:checked').value,
      ballot =  document.querySelector('input[name="ballot-type"]:checked').value

  var dem1 = document.getElementById('candidate1-d').value,
      dem2 = document.getElementById('candidate2-d').value,
      rep1 = document.getElementById('candidate1-r').value,
      rep2 = document.getElementById('candidate2-r').value

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

var q = d3.queue();
q.defer(d3.json, theMap);
q.defer(d3.csv, theDataPath, preload);
q.defer(d3.csv, theDataPath2, preload);
q.await(renderMap);

function renderMap (error, map, data, data2) {
  if (error) throw error;
  theData.dem = data,
  theData.rep = data2

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
      .on("mouseout", tt.hide )
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

// function getFromData(id, prop, data, type) {
//   //TODO use simplified mapDict created from oneCandidate()/twoCandidates()
//   var result = data.find(function(el){
//     // type can be "Election_Day" or "VBM"
//     return +el[prop] === +id && el.ballot_type === type
//   })
//   return result
// }

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


/* add listener to select options */
$(".candidate-list").change(ui.switchCandidate)