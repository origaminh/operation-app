﻿angular.module('operationApp').controller('ImportDataController', ['$routeParams','$scope','$http','$q','$timeout','dataService','utilityService',
  function($routeParams,$scope,$http,$q,$timeout,dataService,utilityService){
    //Init activities
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
    var importData = this;             // Bind controller to variable dashboard
    window.scope = $scope;
    window.importData = this;
    importData.currentDeliveryDate = moment().startOf('day')._d;
    $scope.spSites = [	{Id: "Top",Value:"",Title:"Operation Site"},
    					{Id: "Marketing",Value:"/marketing",Title:"Marketing Site"}
    				];
    importData.selectedSite = $scope.spSites[0];	// Set default site to Top level site

    
    // Lấy ra các loại Service Code (dịch vụ chuyển phát) để xếp vận đơn
    dataService.getListItems("Top","ServiceCodes").then(function(res){
      $scope.serviceCodes = res.data.value;
    },function(err){
      console.log(err);
    });
    
    //ng-change // Get Lists of newly selected Site
    $scope.getListsOfSite = function(siteId){
    	dataService.getLists(siteId).then(function(res){
	      $scope.spLists = res.data.value;
	    },function(err){
	      console.log(err);
	    })
    }
    $scope.getListsOfSite(importData.selectedSite.Id);
    //********ng-change // Get List Fields of newly selected List
    $scope.getListFields = function(listTitle){
      dataService.getListFields(importData.selectedSite.Id,listTitle).then(function(res){
        $scope.listFields = res.data.value;
        
        $scope.missingFields = [];
        $scope.listFields.forEach(function(fieldObj){
          if (fieldObj.Required){
            $scope.importedData.rows.forEach(function(row){
              var headerName = fieldObj.StaticName + (fieldObj.TypeAsString == "Lookup" ? "Id" : "");
              var header = findItemByField($scope.importedData.headers,headerName,"Title");
              var headerIndex = $scope.importedData.headers.indexOf(header);
              // Got the headerIndex value
              if (row[headerIndex] && row[headerIndex].Value == "" && $scope.missingFields.indexOf(headerName) == -1){
                $scope.missingFields.push(headerName);
              }
            });
          }
        });

        $scope.importedData.headers.forEach(function(headerObj){
            headerObj.Title = unify(headerObj.Title);
            // if StaticName exists as h.Title for h in scope.importedData.headers 
            headerObj.exists = false;
            $scope.listFields.forEach(function(fieldObj){
              // ---- Field checking and processing if necessary
              switch(fieldObj.TypeAsString) {
                  case "Lookup":
                      if(fieldObj.StaticName+"Id"==headerObj.Title){
                        headerObj.exists = true;
                      }
                      break;
                  case "Boolean":
                      if ( fieldObj.StaticName == headerObj.Title ){
                        headerObj.exists = true;
                        headerObj.processBoolean = true;
                      }
                      break;
                  case "DateTime":
                      if ( fieldObj.StaticName == headerObj.Title ){
                        headerObj.exists = true;
                        headerObj.processDateTime = true;
                      }
                      break;
                  default:
                      if ( fieldObj.StaticName == headerObj.Title ){
                        headerObj.exists = true;
                      }
              }
            });
            
        });
      },function(err){
        console.log(err);
      })
    }
 
    // Tính Estimated Date cho vận đơn COD khi chọn dịch vụ chuyển phát 
    $scope.getEstimatedDate = function(fromDate,days,workSat,workSun){
      var a = moment(fromDate).add(1,'days').startOf('day');  // Doesnt count start date
      var b = moment(fromDate).add(days,'days').endOf('day');
      for (var m = moment(a); m.isBefore(b); m.add(1, 'days')) {
        if (m.weekday() == 6 && !workSat){
          b.add(1,'days');    // Check Saturday
        }
      }
      for (var m = moment(a); m.isBefore(b); m.add(1, 'days')) {
        if (m.weekday() == 7 && !workSun){
          b.add(1,'days');    // Check Saturday
        }
      }
      return b.startOf('day');
    }

    importData.assignTC = function(){
      getHeaderIndex = function(field){
        var header = findItemByField($scope.importedData.headers,field,"Title");
        return $scope.importedData.headers.indexOf(header);
      } // -----------

      if (!importData.selectedList || importData.selectedList.Title != "CODs"){
        alert("Cannot run this function while CODs List is not selected!") 
      } else {
        // ****** Current rule for assigning delivery information
        $scope.importedData.rows.forEach(function(row){
          // ActivationCode
          row[getHeaderIndex("ActivationCode")].Value = row[getHeaderIndex("ActivationCode")].Value.replace("#","");
          // Assign TrackingCodeTitle
          row[getHeaderIndex("TrackingCodeTitle")].Value = "TWLL"+pad(row[getHeaderIndex("GambitId")].Value-60,7);
          // Assign DeliveryDate
          row[getHeaderIndex("DeliveryDate")].Value = moment(importData.currentDeliveryDate).format();
          // If CustomerWishDate is blank or equal ND estimate
          var wishDateValue = row[getHeaderIndex("CustomerWishDate")].Value;
          var estimate2D = $scope.getEstimatedDate(importData.currentDeliveryDate,2); 
          
          if ( estimate2D.isSameOrBefore(moment(wishDateValue)) ){
            row[getHeaderIndex("EstimatedDate")].Value = estimate2D.format();
            row[getHeaderIndex("ServiceCodeId")].Value = 2;
          } else {
            row[getHeaderIndex("EstimatedDate")].Value = $scope.getEstimatedDate(importData.currentDeliveryDate,2).format();
            row[getHeaderIndex("ServiceCodeId")].Value = 1;
          }

        })
      }
    }
    
    $scope.showListFieldsIf = function(field){
      var notShowing = ['Content Type','Content Type ID','Attachments','Property Bag','Name','Order'];
      if(notShowing.indexOf(field.Title) != -1){
        return false;
      } 
      
      if(field.Title == "ID" || !field.ReadOnlyField){
        return true;
      }
    }

    // ng-click // Start sending data from the displayed data ($scope.importedData) to SharePoint
    importData.startSending = function(siteId){	// List information is referenced from importData.selectedList
      var batchDelayTime;
      do {
        batchDelayTime = prompt("Please enter the delay time (in seconds) between each batch of 30 items.");
      }
      while (!batchDelayTime || isNaN(batchDelayTime));
      
      // ------Empty the resulted/processed array every time raw data is imported------
      $scope.processedData = [];
      console.log("Start updating $scope.importedData to SharePoint");
      // ----------------------------------------
      dataService.getDigestValue(siteId).then(function(res){
        importData.loading = true;
        var digestValue = res.data.FormDigestValue;
        var currentRowId = 0;  //***// Choose starting Index to process
        
        // Make this promise based
        var deferred = $q.defer();
        //****Initiate**********//
        makeRequest(currentRowId);
        //-----------------------
        function makeNextRequest(){// **********// Loop with currentRowId++
          // Increment progress.      //
          currentRowId++;
          if (currentRowId < $scope.importedData.rows.length){  
            // Continue if there are more items.//
                if (currentRowId && currentRowId % 30 == 0){
                  console.log("Waiting "+batchDelayTime+" sec every 30 items.")
                  setTimeout(function(){  // setTimeout to avoid too heavy of an import load
                    makeRequest(currentRowId);											//------------
                  },batchDelayTime*1000);												//------------
                } else {																//------------
                  makeRequest(currentRowId);	// Make sure this if always ends up running makeRequest //
                }								//------------
            //-----------------------------------//
          } else {
            // Resolve the promise otherwise.//
            deferred.resolve();
            importData.loading = false;
            scope.$apply() 
            console.log("Data import is completed!")
            // Deferred function ends when currentRowId has run passed length of data //             
          }
           
        } // -----------------------
        //

        //*********************************Action takes place here
        function makeRequest(rowDataIndex){
          // Define the location of Row with inherited index
          var rowDataValues = $scope.importedData.rows[rowDataIndex]
          if(!rowDataValues ){
          	makeNextRequest();
          	return false;
          }
          // Define the format of $scope.processedData as
          //  [obj, {
          //    Value: *someStringValue* 
          //  } ,obj,obj]
          $scope.processedData[rowDataIndex] = {}; 
          $scope.importedData.headers.forEach(function(headerObj,headerIndex){
            //                                               //
            //     Format the data based on Field types      //
            //                                               //
            var oldValue = rowDataValues[headerIndex].Value;
            if (headerObj.processDateTime){         // DateTime
              if (oldValue && oldValue.length > 0){
                $scope.processedData[rowDataIndex][headerObj.Title] = moment(oldValue).format();
              }
            } else if (headerObj.processBoolean){   // Boolean
              if (oldValue == 'Yes'){
                $scope.processedData[rowDataIndex][headerObj.Title] = true;
              } else if (oldValue == 'No'){
                $scope.processedData[rowDataIndex][headerObj.Title] = false;
              }
            } else if (oldValue != "") {
              $scope.processedData[rowDataIndex][headerObj.Title] = oldValue;
            }
            
            
          }); // *****************************
          // Adding metadata 
          $scope.processedData[rowDataIndex]['__metadata'] = { 
            "type": importData.selectedList.ListItemEntityTypeFullName 
          };
          /*--------------------------Angular solution, not working
          // Send POST request to Create new item for the selected list
          //dataService.createNewListItem(siteId,listName,digestValue,$scope.processedData[rowDataIndex])
          dataService.createNewListItem( importData.selectedSite.Id,
          								 importData.selectedList.Title,
          								 digestValue,
          								 $scope.processedData[rowDataIndex] ).then(function(res){

            // Check whether the selectedList needs further actions performed
              debugger;
              var UtmCampaignValue = res.d.UtmCampaignValue;
              var UtmMediumValue = res.d.UtmMediumValue;
              
              //----------------
              makeNextRequest();

		 },function(err){
		 	console.log(err);
		 	deferred.resolve();
		 });*/
		 // jQuery solution --- needs to be optimized**********
		 var headers = {};
          headers["Accept"] = "application/json;odata=verbose";
          headers["X-RequestDigest"] = digestValue;
          
          $.ajax({
            url: "https://edumallinternational.sharepoint.com"+importData.selectedSite.Value+
            	"/_api/web/lists/GetByTitle('"+importData.selectedList.Title+"')/items",   
            type: "POST",
            processData: false,  
            data: JSON.stringify($scope.processedData[rowDataIndex]),
            contentType: "application/json;odata=verbose",
            headers: headers, 
            success: function(res){ 
              // Gọi tiếp makeNextRequest để loop callback
              makeNextRequest();

              //console.log(res);
              
              // Check whether the selectedList needs further actions performed
              // Làm thao tác giống workflow
              if (res.d.__metadata.type == "SP.Data.C3sListItem"){
              	
              	// Format C3 Workflow
              	// ************
              	// ************
              	  //debugger;
              	  var campaignId, advertisementId;
              	  var itemId = String(res.d.Id);
              	  var UtmCampaignValue = res.d.UtmCampaignValue;	// UtmCampaign ~ Campaign field
              	  var UtmMediumValue = res.d.UtmMediumValue;		// UtmMedium ~ Advertisement field
              	  convertValueToLookup(      "Marketing","C3s"  ,itemId,UtmCampaignValue,"CampaignId","Campaigns","Title");
              	  convertValueToLookup(      "Marketing","C3s"  ,itemId,UtmMediumValue,"AdvertisementId","Advertisements","Title");
	              
              }

              function convertValueToLookup(siteId,listTitle,itemId,LookupValue,LookupField,TarListTitle,TarListField) {
                  var targetItemId;
                  dataService.getItemsByField(siteId,TarListTitle,formatAsUri(LookupValue),TarListField)//Check the Target List
                  .then(function(res){								// -------- LookupValue needs to be formatted as uri
                    if( res.data.value.length != 0 ){				// if there's an item with this Target Field's value
                      targetItemId = String(res.data.value[0].Id);//then set targetItemId to the queried item's Id
                      //**************************
                      // Found existing Target List item with TarListField : LookupValue --> update current item with targetItemId
                      var data1 = {};
                      data1[LookupField] = targetItemId;
                      updateListItem(headers, data1 ,itemId,listTitle,siteId);
                      //-----------------
                    } else {
                      // Create a new item in Target List and assign newly generated Id to targetItemId
                      // *************************
                      var data2 = {};
                      data2[TarListField] = LookupValue;
                      data2 = addMetadataTo( data2 ,TarListTitle);
                      $.ajax({
                        url: "https://edumallinternational.sharepoint.com/"+siteId+
                        "/_api/web/lists/GetByTitle('"+TarListTitle+"')/items",   
                    type: "POST",
                    processData: false,  
                    data: JSON.stringify( data2 ),
                    contentType: "application/json;odata=verbose",
                    headers: headers,
                    success: function(res){
                      targetItemId = String(res.d.Id)
                      //*******
                      var data3 = {};
                          data3[LookupField] = targetItemId;
                          updateListItem(headers, data3 ,itemId,listTitle,siteId);
                      //*******************
                    },
                    error: function(err){
                      console.log(err);
                    }
                      });              	  	}
                  },function(err){
                    console.log(err)
                  });
              }
              
            },
            error: function(res){ 
              console.log(res);
              deferred.resolve();
            }
          });
          // **************************************************
                    
        }  //----------End of makeRequest function
        // ---------------------------------------
      },function(err){
        console.log("Failed to call contextinfo endpoint & acquire DigestValue");
      });
      
    }

    importData.FromSelectedCSV = function(){
      
      var selectedCSV = $("input[type='file']")[0].files[0];
      if(selectedCSV){
        Papa.parse(selectedCSV, {
          complete: function(result) {
            // All rows are converted in to arrays of value-array
            importData.selectedList = null;
            $scope.importedData = utilityService.convertToRichTable(result.data);
            $scope.$apply();
          }
        });
      }
      

    }

    importData.FromDefaultSource = function(){
      importData.loading = true;
      // This is a jQuery operation 
      // ---> needs to call $scope.apply() at the end
      console.log("Begin to import data from default source.")
      $.ajax({
          type: "GET",
          url: "data.csv",
          dataType: "text",
          success: function(data) {
            //console.log(data);
            $scope.importedData = processCSVData(data);

          },
          error: function(err){
            console.log(err);
          },
          complete: function(res){
            importData.selectedList = null;
            importData.loading = false;
            $scope.$apply();
          }
      });
    }

    $scope.hasInvalidHeader = function(){
      var result = false
      $scope.importedData.headers.forEach(function(headerObj){
        if(!headerObj.exists){
          result = true;
        }
      });
      return result;
    }

    $scope.showMissingFields = function(){
      if($scope.missingFields && $scope.missingFields.length > 0){
        return $scope.missingFields.join(', ');
      }
    }

    $scope.keysOf = function(obj){
      return obj? Object.keys(obj) : [];
    }

    function compare(a,b) {   //This function must stay in this controller to use mv.sorting
      //Compare by mv.sorting.property, order mv.sorting.ascending true/false
      if (!a[mv.sorting.property] || a[mv.sorting.property] == "")
        return mv.sorting.ascending ? -1 : 1;
      else if (!b[mv.sorting.property] || b[mv.sorting.property] == "")
        return mv.sorting.ascending ? 1 : -1;
      else if (a[mv.sorting.property] < b[mv.sorting.property])
        return mv.sorting.ascending ? -1 : 1;
      else if (a[mv.sorting.property] > b[mv.sorting.property])
        return mv.sorting.ascending ? 1 : -1;
      else
        return 0;
    }
  }]
);

function newProcessCSVData(data){
  console.log(data)
  debugger;
  var processedData = Papa.parse(data); 

  return processedData;
}

function processCSVData(data){
  var newLine = String.fromCharCode(10)
  // csvData is imported as string data
  // All the first string values are headers, ending with newLine char

  var headers = []
  var headerTitles = data.substring(0,data.indexOf(newLine)).split(",");
  headerTitles.forEach(function(headerTitle){
    headers.push({ Title: headerTitle });
  });
  
  var rowsData = []

  var rowsStringData = data.substring(data.indexOf(newLine)+1,data.length).split(newLine);
  rowsStringData.forEach(function(rowString,rowIndex){ 
    if (rowString !== ""){
      // Add 1 row in rowsData
      rowsData.push( [] );  // should have the same index as rowIndex 
      // --> can be referenced with rowsData[rowIndex]

      var fieldStringValues = rowString.split(",");

      fieldStringValues.forEach(function(fieldStringValue){
        // Create an object in rowsData array for each fieldValue 
        rowsData[rowIndex].push({
          Value: fieldStringValue
        });
      });
    }
    
  });

  return {
    headers: headers,
    rows: rowsData
  }

}

function compareStr(str1,str2){
  var newStr = "";
  for (var i = 0, len = str1.length; i < len; i++) {
    if(str1[i] != str2[i]){
      debugger;
    }
  }
  return newStr;
}


//////////////////////////////////
function postJson(payload,isUpdate) {
    //First get the REQUESTDIGEST value
	$.ajax({
	    url: "https://edumallinternational.sharepoint.com/_api/contextinfo",
	    method: "POST",
	    headers: { "Accept": "application/json; odata=verbose"},
	    success: function (data) {
	    	
	    	var requestDigest = data.d.GetContextWebInformation.FormDigestValue;
        var headers = {};
        headers["Accept"] = "application/json;odata=verbose";
        headers["X-RequestDigest"] = requestDigest;
        if(isUpdate) {
          headers["X-HTTP-Method"] = "MERGE";
          headers["If-Match"] = "*";
        }
        
        $.ajax({       
          url: "https://edumallinternational.sharepoint.com/_api/web/lists/GetByTitle('NewList')/items",   
          type: "POST",   
          processData: false,  
          data: JSON.stringify(payload),
          contentType: "application/json;odata=verbose",
          headers: headers, 
          success: function(res){ console.log(res) },
          error: function(res){ console.log(res) }
        });
      },
      error: function(res){ console.log(res) }
      }
    );
}

function handlePaste (elem, e) {
  //Get modelViewController as mv
  var $scope = window.scope;
  var importData = window.scope.importData;
  importData.pastingData = true;
  /*importData.loading = true;
  $scope.$apply();*/ //Couldnt make pending gif appear
  //Get utilityService
  var utilityService = angular.element($("[ng-app]")[0]).injector().get('utilityService');

  if (e && e.clipboardData && e.clipboardData.getData) {
    // browser supports clipboardData
    var pasteText = e.clipboardData.getData('text').trim();
    var pasteData = utilityService.createTableFromString(pasteText);

    // ***********
    importData.selectedList = null;
    $scope.importedData = utilityService.convertToRichTable(pasteData);
    //importData.loading = false; //Couldnt make the pending gif appear
    $scope.$apply();
    
    // ***********
    
    if (e.preventDefault) {
      e.stopPropagation();
      e.preventDefault();
    }
  }
  else {// Everything else - empty editdiv and allow browser to paste content into it, then cleanup
    alert("Your browser does not support pasting content from the clipboard!");
  }
  
  
  return false;
}

function updateListItem(headers,updateData,itemId,listTitle,siteId){
              	  			// headers already contain digestValue
              	  			var newHeaders = $.extend({},headers);	// new Header for the action of updating item
	              	  		newHeaders["X-HTTP-Method"] = "MERGE";
	            			newHeaders["If-Match"] = "*";
	            			// metadata for C3s
	            			updateData["__metadata"] = { "type": "SP.Data."+listTitle+"ListItem" };
	              	  		$.ajax({
	              	  			url: "https://edumallinternational.sharepoint.com/"+siteId+
					            	"/_api/web/lists/GetByTitle('"+listTitle+"')/items("+itemId+")",   
					            type: "POST",
					            processData: false,  
					            data: JSON.stringify(updateData),
					            contentType: "application/json;odata=verbose",
					            headers: newHeaders,
					            success: function(res){
					            	//console.log(res);
					            },
					            error: function(err){
					            	console.log(err);
					            }
	              	  		});
              	  		}
              	  		
function addMetadataTo(data,ListTitle){
		              	  			data["__metadata"] = { "type": "SP.Data."+ListTitle+"ListItem" };
		              	  			return data;
		              	  		}