/* init values */
var theData = 'data/pres_dem.csv',
    theMap  = 'data/elect_precincts_topo.json',
    geometry = 'elect_precincts',
    // theMap  = 'data/sfneighborhoods_topo.json',
    // geometry = 'SFFind_Neighborhoods',
    geoClass = 'blue',
    defprop = 'HILLARY_CLINTON'

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

// var zoom = d3.behavior.zoom()
//     .translate([0, 0])
//     .scale(1)
//     .scaleExtent([1, 8])
//     .on("zoom", zoomed);
// function zoomed () {}

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
  var ui = d3.dispatch('clickedGeo', 'mouseOver')
  ui.on('clickedGeo', function(geoId){
  })
  ui.on('mouseOver', function(d, el) {
    var me = d3.select(el),
    thisText = 'value: ' + d.id
    return tt.follow(me, thisText)
  })
/* end ui dispatcher */


var q = d3.queue();
q.defer(d3.json, theMap);
q.defer(d3.csv, theData);
// q.defer(d3.csv, theData, numberify);
q.await(drawMap);

function drawMap (error, map, data) {
  if (error) throw error;
  var exten = d3.extent(data,function(el){ return +el[defprop] })
  colors.domain(exten)

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
        var obj = getFromData(d.id, 'precinct', data) || ''
        var colorBin = colors(obj[defprop])
        return colorBin + ' ' + geoClass
      })
  //
  // debugger
}

function getFromData(id, prop, data) {
  var result = data.find(function(el){
    return el[prop] === id && el.ballot_type === "Election Day"
  })
  // console.log(id)
  return result
}

function numberify (obj) {
  for (prop in obj){
    if(!isNaN(+obj[prop])) obj[prop] = +obj[prop]
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
