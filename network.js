

function sum(array){
    var total = 0;
    for(var i=0; i < array.length; i++) { total += array[i]}
    return total
}


function half_pie(array, startAngle){
    var total = sum(array);
    var result = [];
    var angle = startAngle;
    for(var i=0; i < array.length; i++) {
	item = {};
	item["total"] = total;
	item["startAngle"] = angle;
	item["endAngle"] = angle + Math.PI*array[i]/total;
	angle = item["endAngle"];
	result.push(item);
    }
    return result;
}


//Width and height
var w = 500;
var h = 500;


//Scale links
var link_scale = 1000;
var power_scale = 10;



//Index at start
var start_snapshot_index = 4;

//Define map projection

var projection = d3.geo.mercator() //utiliser une projection standard pour aplatir les pôles, voir D3 projection plugin
    .center([ 9.3, 52 ]) //comment centrer la carte, longitude, latitude
    .translate([ w/2, h/2 ]) // centrer l'image obtenue dans le svg
    .scale([ w/0.68]); // zoom, plus la valeur est petit plus le zoom est gros

//Define path generator
var path = d3.geo.path()
    .projection(projection);


document.getElementById("timeslide").max=snapshots.length-1;

document.getElementById("timeslide").value = start_snapshot_index;

document.getElementById("range").innerHTML=snapshots[start_snapshot_index];


//Create SVG
var svg = d3.select("#container")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

//Load in GeoJSON data
d3.json("ne_50m_admin_0_countries_simplified.json", function(json) {


    countries = svg.append("g")
        .attr("id","countries");

    //Bind data and create one path per GeoJSON feature
    countries.selectAll("path")
	.data(json.features)
	.enter()
	.append("path")
	.attr("d", path)
	.attr("stroke", "rgba(8, 81, 156, 0.2)")
	.attr("fill", "rgba(8, 81, 156, 0.01)");


    line_layer = svg.append("g")
        .attr("id","lines");


    var lineFunction = d3.svg.line()
        .x(function(d) { return d[0] })
        .y(function(d) { return d[1] })
        .interpolate("linear");

    lines = line_layer.selectAll("path")
	.data(links.index)
	.enter()
	.append("path")
	.attr("d", function(d, i) { return lineFunction([projection([links.x0[i],links.y0[i]]),projection([links.x1[i],links.y1[i]])])})
        .attr("class", "flowline")
        .attr("stroke-width", function(d, i) { return flows[start_snapshot_index][i]/link_scale});


    // This is a function which transforms arc data into a path
    arc_path = d3.svg.arc()
        .innerRadius(0);

    // This is a function which turns a list of numbers into arc data (start angle, end angle,  etc.)
    pie = d3.layout.pie()
	.sort(null);

    signs = ["positive","negative"];

    startAngle = {"positive" : -Math.PI/2, "negative" : Math.PI/2};

    sign_layer = {};

    sign_locations = {};

    for(var k=0; k < signs.length; k++) {

	sign = signs[k];

	sign_layer[sign] = svg.append("g").attr("id",sign);


	sign_locations[sign] = sign_layer[sign].selectAll("g")
            .data(power[sign])
            .enter()
            .append("g")
            .attr("transform", function(d,i) { return "translate(" + projection([buses.x[i],buses.y[i]])[0] +","+ projection([buses.x[i],buses.y[i]])[1] + ")" } );



    sign_locations[sign].selectAll("path")
            .data(function(d) {return half_pie(d[start_snapshot_index], startAngle[sign])})
        .enter()
        .append("path")
        .attr("d", function(d) { return arc_path.outerRadius(d["total"]**0.5/power_scale)(d)})
	    .attr("class",sign)
        .style("fill", function(d, i) { return carriers[sign].color[i] });

    };

});


// when the input range changes update the value
d3.select("#timeslide").on("input", function() {
    update(+this.value);
});


function update(value) {
    document.getElementById("range").innerHTML=snapshots[value];

    line_layer.selectAll("path")
        .attr("stroke-width", function(d, i) { return flows[value][i]/link_scale});

    for(var k=0; k < signs.length; k++) {

	sign = signs[k];

	// don't need enter() and append() here...
	sign_locations[sign].selectAll("path")
            .data(function(d) {return half_pie(d[value], startAngle[sign])})
        .attr("d", function(d) { return arc_path.outerRadius(d["total"]**0.5/power_scale)(d)})
        .style("fill", function(d, i) { return carriers[sign].color[i] });
    }
}
