//http://www.asp.net/web-api/overview/odata-support-in-aspnet-web-api/using-select-expand-and-value
//https://chrisstahl.wordpress.com/2014/07/31/getting-started-with-rest-in-sharepoint-2013-part-3/
//http://windyroad.com.au/2007/03/30/web-apps-the-new-single-threaded-gui/

angular.module('operationApp').controller('DashboardController', function($routeParams,$scope,$http,dataService){
  //Bind controller to variable dashboard
  var dashboard = this;
  var index = 0;//index variable for paging
  //Datetime paramters for search query
  var beginDate = "";
  var endDate = "";
  var filterQuery = "";
  //to make sure it's not loaded each time we activate a tab
  var isTmReportLoaded = 0;
  var isSaleReportLoaded = 0;
	
	var username = getCookie("username");
	if(username === null || username === "undefined"){
		loginForm($http, dataService);
	}
	pollRequest(username);
	$("#logout_btn").click(function(){
    	document.cookie ='username=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
    	window.location.href = "https://edumallinternational.sharepoint.com/frontEnd/index.html";
    });
	$("#topmenu_username").empty();
	$("#topmenu_username").append(username);
  dashboard.info = dataService.getModelView();
  window.dashboard = dashboard;
  if(typeof w2ui.order_table !== "undefined"){
  	w2ui.order_table.destroy();
  }
  $("#dashboard_table").w2grid({
		show: {
			header: true,
			footer: true,
			lineNumber: true,
			toolbar: true
		},
		name: "order_table",
		columns: [
			{field: "orderId", caption:"ID", size: "10%"},
			{field: "orderCod", caption:"COD", size: "10%"},
			{field: "orderAdvisor", caption: "Advisor", size: "15%"},
			{field: "orderCourse", caption: "Course", size: "15%"},
			{field: "orderBuyer", caption: "Buyer", size: "10%"},
			{field: "orderInstructor", caption: "Instructor", size: "10%"},
			{field: "orderAmount", caption:"Amount (BATH)", size: "10%"},
			{field: "orderStatus", caption:"Status", size: "15%"},
			{field: "orderTrackingCode", caption:"Tracking Code", size: "10%"},
			{field: "orderDate", caption: "Ordered Date", size: "10%"}
		]
	});
	
	$scope.loading = true;
	$http({
		method: 'GET',
		async : true,
		cache : false,
		url: "https://edumallinternational.sharepoint.com/_api/web/lists/getbytitle('CompletedOrders')/items?$filter="
		+ "Status eq 'L8-Success' and Id gt 12000"// and OrderedDate eq '2016-08-11'
		+ "&$top=50&$orderby=Id asc"
		+ "&$select=ID,Title,Amount,Status,TrackingCodeTitle,OrderedDate,Advisor/Title,Course/Title,Buyer/BuyerName,Course/InstructorCode"
		+ "&$expand=Advisor,Course,Buyer"
	}).success(function(res, status, headers, config){
		//dashboard.tableRows = res.data;
		var data = res.value; //it's an array
		pushDatatable(data, index);
		$scope.loading = false;
		
	}).error(function(err){
	//console.log(err);
	});
  
	$("#next-btn").click(function(){
		index += 50;
		var bindex = 12000 + index;//where to begin search
		$scope.loading = true;
		$http({
		    method: 'GET',
		    async : true,
			cache : false,
		    url: "https://edumallinternational.sharepoint.com/_api/web/lists/getbytitle('CompletedOrders')/items?"
		    + "$filter=Status eq 'L8-Success' and Id gt " 
		    + bindex 
		    + filterQuery
		    + "&$top=50&$orderby=Id asc"
		    + "&$select=ID,Title,Amount,Status,TrackingCodeTitle,OrderedDate,Advisor/Title,Course/Title,Buyer/BuyerName,Course/InstructorCode"
		    + "&$expand=Advisor,Course,Buyer"
		  }).then(function(res){
		  	
			dashboard.tableRows = res.data;
			var data = res.data.value; //it's an array
			pushDatatable(data, index);
		    $scope.loading = false;
		  },function(err){
		    //console.log(err);
		    $scope.loading = false;
		  });
	
	});
	$("#prev-btn").click(function(){
		index -= 50;
		var bindex = 12000 + index;//where to begin search
		$scope.loading = true;
		$http({
		    method: 'GET',
		    async : true,
			cache : false,
		    url: "https://edumallinternational.sharepoint.com/_api/web/lists/getbytitle('CompletedOrders')/items?"
		    + "$filter=Status eq 'L8-Success' and Id gt " 
		    + bindex 
		    + filterQuery
		    + "&$top=50&$orderby=Id asc"
		    + "&$select=ID,Title,Amount,Status,TrackingCodeTitle,OrderedDate,Advisor/Title,Course/Title,Buyer/BuyerName,Course/InstructorCode"
		    + "&$expand=Advisor,Course,Buyer"
		  }).then(function(res){
			dashboard.tableRows = res.data;
			var data = res.data.value; //it's an array
			pushDatatable(data, index);
		    $scope.loading = false;
		  },function(err){
		    //console.log(err);
		    $scope.loading = false;
		  });

	});
	
	initDate();
	$("#search-btn").click(function(){
		$scope.loading = true;
		beginDate = $('#f_date').data("w2field").el.value;
		endDate = $('#t_date').data("w2field").el.value;
		if(beginDate !== ""){
			beginDate = formatDateForQuery(beginDate, 1);
		}
		if(endDate !== ""){
			endDate = formatDateForQuery(endDate, 1);
		}
		if(beginDate === "" && endDate === ""){
		}else if(beginDate !== "" && endDate === ""){
			filterQuery = " and OrderedDate eq '" + beginDate + "'";
		}else if(beginDate === "" && endDate !== ""){
			filterQuery = " and OrderedDate eq '" + endDate + "'";
		}else if(beginDate !== "" && endDate !== ""){
			var bd = new Date(beginDate);
			var ed = new Date(endDate);
			if(bd.getTime() > ed.getTime()){
			}else{
				filterQuery = " and OrderedDate gt '" + beginDate + "' and OrderedDate lt '" + endDate + "'";
			}
		}
		
		index = 0; //reset it
		$http({
			method: 'GET',
			async : true,
			cache : false,
			url: "https://edumallinternational.sharepoint.com/_api/web/lists/getbytitle('CompletedOrders')/items?$filter="
			+ "Status eq 'L8-Success' and Id gt 12000"// and OrderedDate eq '2016-08-11'
			+ filterQuery
			+ "&$top=50&$orderby=Id asc"
			+ "&$select=ID,Title,Amount,Status,TrackingCodeTitle,OrderedDate,Advisor/Title,Course/Title,Buyer/BuyerName,Course/InstructorCode"
			+ "&$expand=Advisor,Course,Buyer"
		}).success(function(res, status, headers, config){
			//dashboard.tableRows = res.data;
			var data = res.value; //it's an array
			pushDatatable(data, index);
			$scope.loading = false;
			
		}).error(function(err){
		//console.log(err);
			$scope.loading = false;
		});

		
	});
	
	$("#search-tm-report-btn").click(function(){
		$scope.loading = true;

		var instructor  = $("#tm_report_instructor").data("selected").text;
		var reportType = $("#tm_report_type").data("selected").id;
		var beginDateTm = $('#f_date_tm').data("w2field").el.value;
		var endDateTm = $('#t_date_tm').data("w2field").el.value;
		if(beginDateTm !== ""){
			beginDateTm = formatDateForQuery(beginDateTm, 1);
		}
		if(endDateTm !== ""){
			endDateTm = formatDateForQuery(endDateTm, 1);
		}
		if(beginDateTm === "" && endDateTm === ""){
		}else if(beginDateTm !== "" && endDateTm === ""){
			filterQuery = " and OrderedDate eq '" + beginDateTm + "'";
		}else if(beginDateTm === "" && endDateTm !== ""){
			filterQuery = " and OrderedDate eq '" + endDateTm + "'";
		}else if(beginDateTm !== "" && endDateTm !== ""){
			var bd = new Date(beginDateTm);
			var ed = new Date(endDateTm );
			if(bd.getTime() > ed.getTime()){
			}else{
				filterQuery = " and OrderedDate gt '" + beginDateTm + "' and OrderedDate lt '" + endDateTm + "'";
			}
		}
		if(reportType === "0"){
			$("#tm_report_table_h").show();
			$("#tm_report_table_v").hide();
			$http({
				method: 'GET',
				async : true,
				cache : false,
				url: "https://edumallinternational.sharepoint.com/_api/web/lists/getbytitle('CompletedOrders')/items?$filter="
				+ "Status eq 'L8-Success' and Id gt 12000"
				+ filterQuery
				+ " and Course/InstructorCode eq '" + instructor + "'" 
				//+ "&$top=50&$orderby=Id asc"
				+ "&$select=ID,Amount,OrderedDate,Course/InstructorCode"
				+ "&$expand=Course"
			}).success(function(res, status, headers, config){
				//dashboard.tableRows = res.data;
				var data = res.value;
				var records = {};
				for(var i = 0; i < data.length; i++){
					var orderedDate = dateStandardize(data[i].OrderedDate);
					if(typeof records[orderedDate] === "undefined"){
						records[orderedDate] = {
							count: 1,
							amount: data[i].Amount
						};
					}else{
						var count = records[orderedDate].count + 1;
						var amount = records[orderedDate].amount + data[i].Amount;
						records[orderedDate] = {
							count: count,
							amount: amount
						};
					}
				}
				
				if(typeof w2ui.tm_table_h !== "undefined"){
					w2ui.tm_table_h.destroy();
				}
				$("#tm_report_table_h").w2grid({
					show: {
						header: true,
						footer: true,
						lineNumber: true,
						toolbar: true
					},
					name: "tm_table_h",
					columns: [
						{field: "tmDate", caption:"Date", size: "20%"},
						{field: "tmCount", caption: "Count", size: "15%"},
						{field: "tmAmount", caption: "Amount (Bath)", size: "15%"}						]
				});
				//http://stackoverflow.com/questions/19323699/iterating-through-json-object-javascript
				var recd = new Array();
				var index = 1;
				for(var key in records){
					if(records.hasOwnProperty(key)){
						var val = records[key];
						var count = val.count;
						var amount = val.amount;
						recd.push({
							recid: index,
							tmDate: key,
							tmCount: count,
							tmAmount: amount
						});
						index++;
					}
				}
				w2ui.tm_table_h.clear();
		    	w2ui.tm_table_h.add(recd);
		        w2ui.tm_table_h.refresh();

				
				$scope.loading = false;
				
			}).error(function(err){
			//console.log(err);
				$scope.loading = false;
			});
		}else{
			$("#tm_report_table_h").hide();
			$("#tm_report_table_v").show();
			$http({
				method: 'GET',
				async : true,
				cache : false,
				url: "https://edumallinternational.sharepoint.com/_api/web/lists/getbytitle('CompletedOrders')/items?$filter="
				+ "Status eq 'L8-Success' and Id gt 12000"// and OrderedDate eq '2016-08-11'
				+ " and Course/InstructorCode eq '" + instructor + "'"
				//+ "&$top=50&$orderby=Id asc"
				+ "&$select=Amount,OrderedDate,Course/InstructorCode"//must select field that we need to use in filter
				+ "&$expand=Course"
			}).success(function(res, status, headers, config){
				//dashboard.tableRows = res.data;
				var data = res.value; //it's an array
				var monthData = [];
				monthData.t1 = 0;
				monthData.t2 = 0;
				monthData.t3 = 0;
				monthData.t4 = 0;
				monthData.t5 = 0;
				monthData.t6 = 0;
				monthData.t7 = 0;
				monthData.t8 = 0;
				monthData.t9 = 0;
				monthData.t10 = 0;
				monthData.t11 = 0;
				monthData.t12 = 0;
				for(var i = 0; i < data.length; i++){
					var orderedDate = dateStandardize(data[i].OrderedDate);
					orderedDate = new Date(orderedDate);
					var month = orderedDate.getMonth();
					switch(month){
						case 0:
							monthData.t1 =+ 1;
							break;
						case 1:
							monthData.t2 =+ 1;
							break;
						case 2:
							monthData.t3 =+ 1;
							break;
						case 3:
							monthData.t4 =+ 1;
							break;
						case 4:
							monthData.t5 =+ 1;
							break;
						case 5:
							monthData.t6 =+ 1;
							break;
						case 6:
							monthData.t7 =+ 1;
							break;
						case 7:
							monthData.t8 =+ 1;
							break;
						case 8:
							monthData.t9 =+ 1;
							break;
						case 9:
							monthData.t10 =+ 1;
							break;
						case 10:
							monthData.t11 =+ 1;
							break;
						case 11:
							monthData.t12 =+ 1;
							break;

					}
					if(typeof w2ui.tm_table_v !== "undefined"){
						w2ui.tm_table_v.destroy();
					}

					$("#tm_report_table_v").w2grid({
					show: {
						header: true,
						footer: true,
						lineNumber: true,
						toolbar: true
					},
					name: "tm_table_v",
					columns: [
						{field: "tmName", caption:"Instructor", size: "10%"},
						{field: "tmM1", caption: "Jan", size: "5%"},
						{field: "tmM2", caption: "Feb", size: "5%"},
						{field: "tmM3", caption: "Mar", size: "5%"},
						{field: "tmM4", caption: "Apr", size: "5%"},
						{field: "tmM5", caption: "May", size: "5%"},
						{field: "tmM6", caption: "Jun", size: "5%"},
						{field: "tmM7", caption: "Jul", size: "5%"},
						{field: "tmM8", caption: "Aug", size: "5%"},
						{field: "tmM9", caption: "Sep", size: "5%"},
						{field: "tmM10", caption: "Oct", size: "5%"},
						{field: "tmM11", caption: "Nov", size: "5%"},
						{field: "tmM12", caption: "Dec", size: "5%"},
						{field: "tmTotal", caption: "Total", size: "10%"}						]
				});
				var recd = new Array();
				recd.push({
					recid: 1,
					tmName: instructor,
					tmM1: monthData.t1,
					tmM2: monthData.t2,
					tmM3: monthData.t3,
					tmM4: monthData.t4,
					tmM5: monthData.t5,
					tmM6: monthData.t6,
					tmM7: monthData.t7,
					tmM8: monthData.t8,
					tmM9: monthData.t9,
					tmM10: monthData.t10,
					tmM11: monthData.t11,
					tmM12: monthData.t12,
					tmTotal: monthData.t1 + monthData.t2 + monthData.t3 + monthData.t4 
					+ monthData.t5 + monthData.t6 + monthData.t7 + monthData.t8 
					+ monthData.t9 + monthData.t10 + monthData.t11 + monthData.t12
				});
				w2ui.tm_table_v.clear();
		    	w2ui.tm_table_v.add(recd);
		        w2ui.tm_table_v.refresh()
				}
				$scope.loading = false;
				
			}).error(function(err){
			//console.log(err);
				$scope.loading = false;
			});

			
			
		}
		
		
		
	});
	
  $scope.name = 'Dashboard';
  $scope.params = $routeParams;
  //tab processing
  //http://w2ui.com/web/demos/#!combo/combo-5
  $("#tabs").w2tabs({
  	name: "tabs",
  	active: "account_report_tab",
  	tabs: [
  		{id: "account_report_tab", caption: "Accounting Report"},
  		{id: "tm_report_tab", caption: "TM Report"},
  		{id: "sale_report_tab", caption: "Sale Report"}
  	],
  	onClick: function(event){
  		$("#tab_manager .tab").hide();//hide all tab's content before active one
  		$("#tab_manager #" + event.target).show();
  		if(event.target === "tm_report_tab"){
  			if(isTmReportLoaded == 0){
  				//it's the first time so we load init data
  				$http({
					method: 'GET',
					async : true,
					cache : false,
					url: "https://edumallinternational.sharepoint.com/_api/web/lists/getbytitle('Instructors')/items?$select=InstructorCode"
				}).success(function(res, status, headers, config){
					var data = res.value;
					var instructors = new Array();
					for(var i = 0; i < data.length; i++){
						instructors.push({text: data[i].InstructorCode, id: i});
					}
					$("#tm_report_instructor").w2field("list", {
						items: instructors,
						selected: instructors[0]
					});
					$("#tm_report_type").w2field("list",{
						items: [
							{text: "Horizonal", id: "0"},
							{text: "Vertical", id: "1"}
						],
						selected: {text: "Horizonal", id: "0"}
					});
					$scope.loading = false;
					
				}).error(function(err){
				//console.log(err);
					$scope.loading = false;
				});
  				isTmReportLoaded = 1;
  			}
  		}else if(event.target === "sale_report_tab"){
  			if(isSaleReportLoaded === 0){
  				isSaleReportLoaded = 1;
  			}
  		}else{
  			w2ui.order_table.refresh();
  		}
  	}
  });
  $("#tab_manager .tab").hide();
  $("#account_report_tab").show();
	//initPage();
});

/**
* Init date fields
*/
function initDate(){
	$('input[type=us-date1]').w2field('date', { format: 'dd/mm/yyyy', end: $('input[type=us-date2]') });
    $('input[type=us-date2]').w2field('date', { format: 'dd/mm/yyyy', start: $('input[type=us-date1]') });
    $('input[type=us-date3]').w2field('date', { format: 'dd/mm/yyyy', end: $('input[type=us-date4]') });
    $('input[type=us-date4]').w2field('date', { format: 'dd/mm/yyyy', start: $('input[type=us-date3]') });
};

/**
* Load all Instructor
*/
function loadInstructorList(){
	
};

/**
* Push data to table
*/
function pushDatatable(data, index){
	var records = new Array();
	for(var i = 0; i < data.length; i++){
		var record = data[i];
		records.push({
			recid: index + i + 1,
			orderId: record.ID,
			orderCod: record.Title,
			orderAdvisor: record.Advisor.Title,
			orderCourse: record.Course.Title,
			orderBuyer: record.Buyer.BuyerName,
			orderInstructor: record.Course.InstructorCode,
			orderAmount: record.Amount,
			orderStatus: record.Status,
			orderTrackingCode: record.TrackingCodeTitle,
			orderDate: dateStandardize(record.OrderedDate)
		});
    	w2ui.order_table.clear();
    	w2ui.order_table.add(records);
        w2ui.order_table.refresh();
    }
};

/**
 * 
 * @param {type} date
 * @param {type} format 1 la cho dinh dang y-m-d, 0 la cho dinh dang y/m/d
 * @returns {String}
 */
function formatDateForQuery(date, format){
    var d = date.split("/");
    if(format === 1){
        return d[2] + "-" + d[1] + "-" + d[0];
    }
    if(format === 0){
        return d[2] + "/" + d[1] + "/" + d[0];
    }
};

/**
* "2016-07-26T17:00:00Z" --> 26/07/2016
*/
function dateStandardize(date){
	var d = date.split("-");
	//console.log(d[2].substring(0,2));
	return d[2].substring(0,2) + "/" + d[1] + "/" + d[0];
};

function initPage(){
	var index = 0;
	$.ajax({
		type: "GET",
		dataType: "json",
		url: "https://edumallinternational.sharepoint.com/_api/web/lists/getbytitle('CompletedOrders')/items?$filter=Status eq 'L8-Success' and Id gt " + 12000 + "&$top=50&$orderby=Id asc",
		beforeSend: function(){
			$(".loading").show("slow");
		},
		error: function(){
			$(".loading").show("slow");
		},
		success: function(res, textStatus, jqXHR){
			$(".loading").show("slow");
			index += 50;
			//dashboard.tableRows = res.data;
			console.log(res);
			var data = res.value; //it's an array
			pushDatatable(data, index);
		}
	});
};
