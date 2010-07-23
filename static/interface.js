$(document).ready(function() {
    graphsController();
});

function displayButtons() {
	$(".delete_button").toggle();
	$(".add_control").toggle();
}

function validate(formData, jqForm, options) { 
	var queryString = $.param(formData); 
	var tagValue = $('input[name=tag]').fieldValue();
	var minValue = $('input[name=minValue]').fieldValue();
	var maxValue = $('input[name=maxValue]').fieldValue();
	var value = $('input[name=value]').fieldValue();
	
	if (!tagValue[0]) { 
		$(".msg").text('Please enter a tag for your datastream.');	
		return false; 
	} else if(/\s/.test(tagValue)) {
		$(".msg").text('Please enter a single tag.');
		return false; 
	} else if(!minValue[0]) {
		$(".msg").text('Please a minimum value');
		return false;
	} else if(!maxValue[0]) {
		$(".msg").text('Please a maximum value');
		return false;
	} else if(isNaN(minValue)) {
		$(".msg").text('Only ints as minimum value.');
		return false;
	} else if(isNaN(maxValue)) {
		$(".msg").text('Only ints as maximum value.');
		return false;
	} else if(isNaN(value)) {
		$(".msg").text('Only ints as initial value.');
		return false;		
	} else {
    return true;
	}

} 

function positionTop() {
	var dashboard = $(".dashboard");
	var dashboardPosition = dashboard.position();
    return dashboardPosition.top+120
}

function graphsController() {
  	grapherOpen = false;
	var dashboard = $(".dashboard");	
	var grapher = $(".grapher");
	
	var dashboardPosition = dashboard.position();
	
  	grapher.css("left", dashboardPosition.left);
  	grapher.css("top", dashboardPosition.top+116);
  	
  	$('.grapher').css('opacity',1.0)
	
    $(".graph_button").click(function(){
		if(grapherOpen == false) {
			grapher.animate({"left": "+="+(dashboard.width())}, "slow", function(){
			grapherOpen = true;
			});				
		} else {
	
			grapher.animate({"left": "-="+(dashboard.width())}, "slow", function(){
			grapherOpen = false;
			});
		}
	});
}

function displayForm(currentDatastream) {
	var newDatastream = currentDatastream + 1
	$.get("/formDisplay/"+newDatastream, function(data) {
	$("#add_form").html(data);
	});	
	
}

function displayLogin() {
	$.get("/loginDisplay", function(data) {
	$("#login_form").html(data);
	});		
}

function toggleForms(option) {
	if (option == "digital") {
		//alert("digital")
		$(".form_digital").show();
		$(".form_analog").hide();
	} else if (option == "analog") {
		//alert("analog")
		$(".form_analog").show();
		$(".form_digital").hide();
	}	
}

function createKnob(i,minValue,maxValue,currentValue,state) {
	$('input[type=text]').wheel().bind('ui-wheel-change', 
	function (event, info) {});
	$('#wheel'+[i]).wheel('option', 'max', maxValue).wheel('option', 'background', ' static/images/circle_100x100_border-only-inner.png').wheel('option', 'radius', 25).wheel('option', 'stream', [i]).wheel('option', 'disabled', state).wheel('option', 'anglespan',360).wheel('option', 'angleoffset',0);
}

function updateAnalog(value,element) {
	$.get("/update/"+element+"/"+value, function(data) {
	$("#analogValue"+element).html(value);
	$(".console").html(data);
	});	
}

function updateDigital(element,value) {	
	if($("#digitalValue"+element).html() == 0) {	
		$.get("/update/"+element+"/"+1, function(data) {			
			$("#digitalValue"+element).html(1);	
	 		$("#switchButton"+element).removeClass('buttonOFF');
          	$("#switchButton"+element).addClass('buttonON');              
         	$("#switchLight"+element).removeClass('light_off');
            $("#switchLight"+element).addClass('light_on');
            $(".console").html(data);
	});	
	} else {	
			$.get("/update/"+element+"/"+0, function(data) {		
			$("#digitalValue"+element).html(0);	
	 		$("#switchButton"+element).removeClass('buttonON');
          	$("#switchButton"+element).addClass('buttonOFF');                
         	$("#switchLight"+element).removeClass('light_on');
            $("#switchLight"+element).addClass('light_off');
            $(".console").html(data);
	});	
	}
	
}

function createGraph(i,data_csv) {	
		$("<div id='placeholder"+i+"' style='float:left; width:220px;height:75px; margin-left:30px; margin-bottom:14px; margin-top:10px'></div>").appendTo(".g_middle");
		var arr = new Array();
		arr = data_csv.split(",");
		var out = [];
		
		$.each(arr, function(index, value) { 
			out.push([index, value]);
		});
	
		// plot graph
	 	$.plot($("#placeholder"+i), [
		{ data: out, 
		lines: { show: true, steps: false },
		grid: { hoverable: true, clickable: true },
		points: { show: true }
		}]);		
}

function createStream() {
	$("#form_create").load("form.html");
}