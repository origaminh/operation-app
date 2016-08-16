angular.module('operationApp').controller('HomeController', function($routeParams,$scope,$http,$q,dataService){
  //Bind controller to variable dashboard
  var home = this;
  window.home = this;
  window.scope = $scope;
  $scope.name = 'Home';
  $scope.params = $routeParams;
  $scope.RequiredBooleanFields = ["Boolean"];	// List the name of Boolean fields to show on Form
												// since Boolean fields don't show up by default												
  home.availableForms = [
      {"siteId":"Management","listName":"Ideas","Title":"Contribute an Idea"},
      {"siteId":"Management","listName":"ServiceRequests","Title":"Submit a Service Request"},
      {"siteId":"Management","listName":"Issues","Title":"Report an Issue"}
  ];
  
  home.formSubmit = function(){
  	var newItem = {};
  	home.FormFields.forEach(function(fieldObj){
  		
  		
  		if(typeof fieldObj.Value == "number"){
  			newItem[fieldObj.StaticName] = fieldObj.Value.toString();
  		} else if(fieldObj.TypeAsString == "Lookup"){
  			newItem[fieldObj.StaticName+"Id"] = fieldObj.LookupValue.Id.toString();
  		} else {
  			newItem[fieldObj.StaticName] = fieldObj.Value;
  		}
  	});
  	//
  	newItem['__metadata'] = { 
        "type": "SP.Data."+home.selectedForm.listName+"ListItem" 
      };
      //console.log(newItem)
      home.loading = true;
  	dataService.getDigestValue("Management").then(function(res){
  	
        var digestValue = res.data.FormDigestValue;
        var headers = {};
          headers["Accept"] = "application/json;odata=verbose";
          headers["X-RequestDigest"] = digestValue;
        // Upload the newItem data to SharePoint
        $.ajax({       
	        url: "https://edumallinternational.sharepoint.com/management/_api/web/lists/GetByTitle('"+home.selectedForm.listName+"')/items",   
	        type: "POST",
	        processData: false,  
	        data: JSON.stringify( newItem ),
	        contentType: "application/json;odata=verbose",
	        headers: headers, 
	        success: function(res){ 
	          console.log(res);
	        },
	        error: function(res){ 
	          console.log(res);
	        },
	        complete: function(){ 
	        	home.loading = false;
	        	home.FormFields = [];
	        	home.selectedForm = null;
	        	$scope.$apply();
	        }
	      });
        
    },function(err){
    	console.log(err);
    	home.loading = false; 
    });
  }
  
  home.formIsCompleted = function(){
  	var completed = true;
  	if(home.FormFields){
  		home.FormFields.forEach(function(fieldObj){
	  		if ( !fieldObj.Value && !fieldObj.LookupValue ){
	  			completed = false;	// If fieldObj doesnt have both Value and LookupValue
	  		}
	  	});
	  	return completed;
  	}
  }
  
  $scope.prepareSelectedForm = function(){
    if(!home.selectedForm){ 
    	home.FormFields = [];
    	return false; 
    }
    $scope.Form = {};
    // First, get all the fields of the selected form, then only display Required fields in form 
    dataService.getListFields(home.selectedForm.siteId,home.selectedForm.listName).then(function(res){
        home.AllFields = res.data.value;
        // Get all the required fields and certain Yes/No fields
        home.FormFields = findItemsByField(home.AllFields,[{"Field":"Required","Value":true}]);
        // Loop through all Boolean fields and find the required one(s)
        findItemsByField(home.AllFields,[{"Field":"TypeAsString","Value":"Boolean"}])
        	.forEach(function(boolField){
        	if( $scope.RequiredBooleanFields.indexOf(boolField.Title) != -1 ){
        		home.FormFields.push(boolField);
        	}
        });
        // Acquire lookup values for the Form's lookup field 
        var lookupReq = [];
        home.FormFields.forEach(function(fieldObj){
            if(fieldObj.LookupList){
                lookupReq.push( dataService.getRecentItemsByListGuid(home.selectedForm.siteId,fieldObj.LookupList) );
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

});