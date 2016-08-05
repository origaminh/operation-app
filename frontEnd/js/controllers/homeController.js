angular.module('operationApp').controller('HomeController', function($routeParams,$scope,$http,$q,dataService){
  //Bind controller to variable dashboard
  var home = this;
  window.home = this;
  window.scope = $scope;
  $scope.name = 'Dashboard';
  $scope.params = $routeParams;

  $scope.prepareSelectedForm = function(){
    if(!home.selectedForm){ return false; }
    $scope.Form = {};
    // First, get all the fields of the selected form, then only display Required fields in form 
    dataService.getListFields(home.selectedForm.siteId,home.selectedForm.listName).then(function(res){
        //console.log(res);
        home.AllFields = res.data.value;
        home.FormFields = findItemsByField(res.data.value,[{"Field":"Required","Value":true}]);
        // Acquire lookup values for the Form's lookup field 
        var lookupReq = [];
        home.FormFields.forEach(function(fieldObj){
            if(fieldObj.LookupList){
                lookupReq.push( dataService.getRecentItems(home.selectedForm.siteId,home.selectedForm.listName) );
            }
        });
        $q.all(lookupReq).then(function(res){
            var lookupCount = 0;
            // After acquiring the array(s) of lookup values, loop through home.FormFields again
            home.FormFields.forEach(function(fieldObj){
                if(fieldObj.LookupList){
                    fieldObj.Choices = res[lookupCount].data.value;
                    lookupCount++;
                }
            });
        },function(err){
            console.log(err);
        })


    },function(err){
        console.log(err);
    })
  }

  home.availableForms = [
      {"siteId":"Management","listName":"Ideas","Title":"Contribute an Idea"},
      {"siteId":"Management","listName":"ServiceRequests","Title":"Submit a Service Request"},
      {"siteId":"Management","listName":"Issues","Title":"Report an Issue"}
    ];
  

});
