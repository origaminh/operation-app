angular.module('operationApp').controller('ImportDataController', ['$routeParams','$scope','$http','$q','$timeout','dataService','utilityService',
  function($routeParams,$scope,$http,$q,$timeout,dataService,utilityService){
    //Init activities
    var importData = this;             // Bind controller to variable dashboard
    window.scope = $scope;
    window.importData = this;

    dataService.getLists("Top").then(function(res){
      $scope.spLists = res.data.value
    },function(err){
      console.log(err);
    })
    
    $scope.getListFields = function(listTitle){
      dataService.getListFields("Top",listTitle).then(function(res){
        $scope.listFields = res.data.value
      },function(err){
        console.log(err);
      })
    }

    $scope.importDataFromCSV = function(){
      
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

    importData.updateToSP = function(siteId,listName,itemId,data,idField){
      if(!idField){ idField = "ID"; }
      console.log("Start updating importedData to SharePoint");
      //Test Area
      dataService.updateToSP
      // ----------------------------------------
      dataService.getDigestValue(siteId).then(function(res){
        var requestDigest = res.data.FormDigestValue;
        
        // Make this promise based
        var deferred = $q.defer();
        makeRequest();
        var currentRowId = 0;   // Choose starting Index to process
        function makeNextRequest(){
          if (currentRowId < data.length){     // Continue if there are more items.
            makeRequest(currentRowId);
          } else {
            deferred.resolve();                   // Resolve the promise otherwise.
          }
          currentRowId++;                         // Increment progress.
        }

        function makeRequest(dataRowIndex){
          var rowData = $scope.importedData.rows[dataRowIndex]
          $scope.importedData.headers.forEach(function(headerObj){
            headerObj.Title
          });
          dataService.getItemWithTitle("Top","NewList",1)
          .then(function(res){
            // ****************************
            var etag = res.data.value[0]['odata.etag'];
            

            // ****************************
          },function(err){
            console.log("Failed to retrieve listItem's basic info - Id,Title")
          });
          makeNextRequest();
        }
        // ---------------------------------------
      },function(err){
        console.log("Failed to call contextinfo endpoint & acquire DigestValue");
      });
      
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
            
            importData.loading = false;
            $scope.$apply();
          }
      });
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