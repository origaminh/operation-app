angular.module('operationApp').controller('ImportDataController', ['$routeParams','$scope','$http','$q','$timeout','dataService','utilityService',
  function($routeParams,$scope,$http,$q,$timeout,dataService,utilityService){
    //Init activities
    var importData =  this;             // Bind controller to variable dashboard
    dataService.getLists("Top").then(function(res){
      console.log(res);
    },function(err){
      console.log(err);
    })
    
    
    // This is only used in for displaying up/down sorting icons and the field to sort by
    importData.sorting = {"property":"Id","ascending":true};

    
    importData.updateNewData = function () {
      var currentRowId = 0;
      // Make this promise based.
      var deferred = $q.defer();
      makeRequest();

      function makeNextRequest(){
        currentRowId++;                         // Increment progress.
        if (currentRowId < mv.data.length){     // Continue if there are more items.
          makeRequest();
        } else {
          deferred.resolve();                   // Resolve the promise otherwise.
        }
      }
      function makeRequest() {
        var rowStatus = mv.dataStatus[currentRowId];
        if(rowStatus && rowStatus.changed){
          if(rowDataIsValid(currentRowId)){
            rowStatus.updating = true;
            var postData = mv.data[currentRowId];
            $http({
              method: 'PUT',
              url: 'http://localhost:3000/api/tests',
              data: postData
            }).then( function (res){
              console.log(res);
              mv.data[currentRowId] = res.data;    // Save the result.
              rowStatus.error = rowStatus.changed = false;
              makeNextRequest();
            }, function(err){
              console.log(err);
              rowStatus.error = true;
              rowStatus.errorMessage = err.data.error.message;
              deferred.reject();
            }).finally(function(){
              rowStatus.updating = false;
            });
          } else {
            rowStatus.error = true;
            rowStatus.errorMessage = "Invalid input value type.";
            deferred.reject();
          }

        } else {
          makeNextRequest()
        }

      }
      // return a promise for the completed requests
      return deferred.promise;
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

// ------processData can be called from html event
function processData (elem, e) {
  //Get modelViewController as mv
  var $scope = angular.element(elem).scope().$parent.$parent;
  var importData = angular.element(elem).scope().$parent.$parent.importData;
  importData.processingData = true;
  //Get services
  var utilityService = angular.element($("[ng-app]")[0]).injector().get('utilityService');
  var dataService = angular.element($("[ng-app]")[0]).injector().get('dataService');

  //if (e && e.clipboardData && e.clipboardData.getData) {
    // Not necessary here: Check if the current broswer support clipboar data
    var pasteText = e.clipboardData.getData('text').trim();
    var pasteData = utilityService.createTableFromString(pasteText);

    console.log(pasteData);

    //RowId and ColId of paste target cell
    var pasteColId = Number(elem.closest("[colId]").getAttribute('colId'));
    var pasteRowId = Number(elem.closest("[rowId]").getAttribute('rowId'));

    //Table last row and last column Id
    var tableLR = Number( $("[colId][rowId]")[$("[colId][rowId]").length-1].getAttribute('rowId') );
    var tableLC = Number( $("[colId][rowId]")[$("[colId][rowId]").length-1].getAttribute('colId') );

    //Paste data last row and last column Id
    var pasteLC = pasteColId+pasteData[0].length-1;
    var pasteLR = pasteRowId+pasteData.length-1;


    if ( $("[colId='"+ pasteLC +"'][rowId='"+ pasteRowId +"']").length == 0 ){
      //Paste data's last column Id falls out of table's range
      alert("Paste data falls out of range!");
    } else {
      if ( $("[colId='"+ pasteColId +"'][rowId='"+ pasteLR +"']").length == 0 ){
        //Paste data' last row extends longer than table's range, new rows need to be added
        for (var i = tableLR; i < pasteLR; i++){
          mv.data.push({});
        }
        $scope.$apply();
      }
      pasteData.forEach(function(row,rowIndex){
        row.forEach(function(cell,colIndex){
          $("[colId='"+ (pasteColId+colIndex) +"'][rowId='"+ (pasteRowId+rowIndex) +"']")
            .find("input,textarea").val(cell).trigger('input').trigger('blur');
        });
      });
    };

    if (e.preventDefault) {
      e.stopPropagation();
      e.preventDefault();
    }
  //}
  //else {
  //  alert("Your browser does not support pasting content from the clipboard!");
  //}

  // Done processing data, proceed to update new data
  importData.processingData = false;
  importData.updateNewData();
  return false;
}