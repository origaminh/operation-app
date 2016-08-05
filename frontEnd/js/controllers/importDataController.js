angular.module('operationApp').controller('ImportDataController', ['$routeParams','$scope','$http','$q','$timeout','dataService','utilityService',
  function($routeParams,$scope,$http,$q,$timeout,dataService,utilityService){
    //Init activities
    var importData = this;             // Bind controller to variable dashboard
    window.scope = $scope;
    window.importData = this;
    importData.currentDeliveryDate = moment().startOf('day')._d;

    dataService.getLists("Top").then(function(res){
      $scope.spLists = res.data.value;
    },function(err){
      console.log(err);
    })

    dataService.getListItems("Top","ServiceCodes").then(function(res){
      $scope.serviceCodes = res.data.value;
    },function(err){
      console.log(err);
    })
    
    //********ng-change // Get List Fields of newly selected List
    $scope.getListFields = function(listTitle){
      dataService.getListFields("Top",listTitle).then(function(res){
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
    importData.startSending = function(siteId,listName,indexedField){
      var batchDelayTime;
      do {
        batchDelayTime = prompt("Please enter the delay time (in seconds) between each batch of 30 items.");
      }
      while (!batchDelayTime || isNaN(batchDelayTime));
      
      // ------Empty the resulted/processed array every time raw data is imported------
      $scope.processedData = [];
      if(!indexedField){ 
        indexedField = "Id"; }
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
                    makeRequest(currentRowId);
                  },batchDelayTime*1000);
                } else {
                  makeRequest(currentRowId);
                }
            //-----------------------------//
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
          // Aded metadata 
          $scope.processedData[rowDataIndex]['__metadata'] = { 
            "type": importData.selectedList.ListItemEntityTypeFullName 
          };
          //--------------------------
          //dataService.createNewListItem(siteId,listName,digestValue,$scope.processedData[rowDataIndex])
          
          //dataService.postJson(siteId,listName,digestValue,$scope.processedData[rowDataIndex])

          var headers = {};
          headers["Accept"] = "application/json;odata=verbose";
          headers["X-RequestDigest"] = digestValue;
          /*if(isUpdate) {
            headers["X-HTTP-Method"] = "MERGE";
            headers["If-Match"] = "*";
          }*/
          
          $.ajax({       
            url: "https://edumallinternational.sharepoint.com/_api/web/lists/GetByTitle('"+importData.selectedList.Title+"')/items",   
            type: "POST",
            processData: false,  
            data: JSON.stringify($scope.processedData[rowDataIndex]),
            contentType: "application/json;odata=verbose",
            headers: headers, 
            success: function(res){ 
              //console.log(res);
              makeNextRequest(); 
            },
            error: function(res){ 
              console.log(res);
              deferred.resolve();
            }
          });
          
        }
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