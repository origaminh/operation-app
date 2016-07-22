angular.module('operationApp').controller('ModelViewController', ['$routeParams','$scope','$http','$q','$timeout','dataService','utilityService',
  function($routeParams,$scope,$http,$q,$timeout,dataService,utilityService){
    //Init activities
    var mv =  this;             // Bind controller to variable dashboard
    mv.editMode = false;
    mv.initCol = 1;
    mv.dataStatus = [];
    mv.sortingOrder = ["+id"];  // Structured this way because row ngRepeat used to use orderBy filter, now using actual data sorting
                                // Now this is only used in for displaying up/down sorting icons
    mv.sorting = {"property":"id","ascending":true};

    mv.info = dataService.getModelView() || $scope.modelViews[0]; //$scope.modelViews inherits from MainController
    if(mv.info){
      //Create filter for api call's route
      var filterObj = {"fields":{}};
      for (var key in mv.info.properties){
        filterObj.fields[key] = true;
      }
      var apiRoute = mv.info.route + '?filter=' + JSON.stringify(filterObj);

      $http({
        method: 'GET',
        url: '/api/' + apiRoute
      }).then(function(res){
        //console.log(res);
        mv.data = res.data;
        mv.data.forEach(function(row){

        });
      },function(err){
        console.log(err);
      });
    }
    //------End of Init activities

    function rowDataIsValid(rowId){
      var isValid = true;
      $("[rowId='"+ rowId +"']").each(function(i,cellElem){   // Check all input elements of row for ng-invalid-value-type class
        if( $(cellElem).find('input').hasClass('ng-invalid-value-type') ){
          isValid = false;
        }
      });
      return isValid;
    }

    mv.updateChangedData = function () {
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

    $scope.setSortingOrder = function(property){
      if(mv.sorting.property != property){
        mv.sorting.property = property;
        mv.sorting.ascending = true;
      } else {
        mv.sorting.ascending = !mv.sorting.ascending;
      }
      mv.sortingOrder = [(mv.sorting.ascending? "+" : "-")+property];
      mv.data.sort(compare);
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

function handlePaste (elem, e) {
  //Get modelViewController as mv
  var $scope = angular.element(elem).scope().$parent.$parent;
  var mv = angular.element(elem).scope().$parent.$parent.mv;
  mv.pastingData = true;
  //Get utilityService
  var utilityService = angular.element($("[ng-app]")[0]).injector().get('utilityService');

  if (e && e.clipboardData && e.clipboardData.getData) {

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
  }
  else {// Everything else - empty editdiv and allow browser to paste content into it, then cleanup
    alert("Your browser does not support pasting content from the clipboard!");
  }
  mv.pastingData = false;
  mv.updateChangedData();
  return false;
}
