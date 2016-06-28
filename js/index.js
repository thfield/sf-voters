/* init values */
var theDataPath = 'data/pres_dem.csv',
    theDataPath2 = 'data/pres_rep.csv',
    theMap  = 'data/elect_precincts_topo.json',
    geometry = 'elect_precincts',
    // theMap  = 'data/sfneighborhoods_topo.json',
    // geometry = 'SFFind_Neighborhoods',
    geoClass = 'blue',
    defprop = 'HILLARY_CLINTON',
    ballotType = 'Election_Day',
    candidate1 = 'HILLARY_CLINTON',
    candidate2 = 'BERNIE_SANDERS'

// global vars for loaded data
var theData,
    theData2

var width = 600,
    height = 600,
    active = d3.select(null);

var svg = d3.select("#map_container").append("svg")
    .attr("width", width)
    .attr("height", height)
    // .on("click", stopped, true);

var projection = d3.geo.mercator()
    .center([-122.433701, 37.767683])
    .scale(200000)
    .translate([width / 2, height / 2]);

var path = d3.geo.path()
    .projection(projection);

var bins = rangeArray(9)
var colors = d3.scale.quantize()
colors.range(bins)

/* end init values */

var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([1, 8])
    .on("zoom", zoomed);
function zoomed() {
  var g = d3.select('#map_container .'+geoClass+'s');
  g.style("stroke-width", 1 / d3.event.scale + "px");
  g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

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
      .text(caption);
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
  thisText = 'value: ' + d.id
  return tt.follow(me, thisText)
})
ui.on('switchCompare', function(){
  var secondCandidate = d3.select('#candidate2')
  secondCandidate.classed("hidden", !secondCandidate.classed("hidden"));
})
ui.on('switchParty', function(party){
  var dems = d3.selectAll('.candidates').filter('.dems'),
      reps = d3.selectAll('.candidates').filter('.reps')
  if (party === 'dems'){
    dems.classed("hidden", false)
    reps.classed("hidden", true)
  }
  if (party === 'reps'){
    dems.classed("hidden", true)
    reps.classed("hidden", false)
  }
})
ui.on('switchBallot', function(ballot){
  ballotType = ballot

})
ui.on('switchCandidate', function(){

})
/* end ui dispatcher */

function redrawMap(){
    // redraw the map after the initial rendering
    svg.selectAll('.'+ geoClass)
        .attr('class', function(d){
          var obj = (d.id, 'precinct', theData, ballotType) || ''
          var colorBin = colors(obj[defprop])
          return colorBin + ' ' + geoClass
        })

}

function readPage() {
  // read the selected values from the page
  var party = document.querySelector('input[name="party"]:checked').value,
      compare = document.querySelector('input[name="compare"]:checked').value,
      ballot =  document.querySelector('input[name="ballot-type"]:checked').value

  var el = document.getElementsByName("candidates-democrats")[0],
      dem1 = el.options[el.selectedIndex].value
  el = document.getElementsByName("candidates-democrats2")[0]
  var dem2 = el.options[el.selectedIndex].value
  el = document.getElementsByName("candidates-republicans")[0]
  var rep1 = el.options[el.selectedIndex].value
  el = document.getElementsByName("candidates-republicans2")[0]
  var rep2 = el.options[el.selectedIndex].value

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
  theData = data,
  theData2 = data2

  var exten = d3.extent(data,function(el){ return +el[defprop] })
  colors.domain(exten)
  var comparison = compareCandidates(data, candidate1, candidate2)

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
        var obj = getFromData(d.id, 'precinct', data, ballotType) || ''
        var colorBin = colors(obj[defprop])
        return colorBin + ' ' + geoClass
      })
  //

}

function compareCandidates(data, candidateA, candidateB) {
  // returns difference of candidateA-candidateB (for sum of VBM and Election_Day)
  return d3.nest()
    .key(function(d) { return d.precinct })
    .rollup(function(p) { var a =
      d3.sum(p, function(d) { return d[candidateA]; })
      -
      d3.sum(p, function(d) { return d[candidateB]; })
      return a
     })
    .map(data)
}

function getFromData(id, prop, data, type) {
  var result = data.find(function(el){
    //"Election_Day" or "VBM"
    return +el[prop] === +id && el.ballot_type === type
  })
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
  var result = [],
      max = bins - 1
  for (var i = 0; i <= max; i++) {
   result.push('q'+ i + '-' + bins);
  }
  return result
}




// function transformData (data) {
//   data.forEach()
//   return data
// }
