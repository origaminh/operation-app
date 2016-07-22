/**
 * Created by Minh on 4/6/2016.
 */
angular.module('DataService',[]).factory('dataService', function($http){
  var dataService = {};

  var spSites = [
    {Id: "Top",Value:""},
    {Id: "Marketing",Value:"/marketing"},
    {Id: "Management",Value:"/management"},
    {Id: "Resources",Value:"/resources"}
  ]
  var spUrl = "https://edumallinternational.sharepoint.com";
  /*var spMarketingUrl = "https://edumallinternational.sharepoint.com/marketing";
  var spManagementUrl = "https://edumallinternational.sharepoint.com/management";
  var spResourcesUrl = "https://edumallinternational.sharepoint.com/resources";*/
  var nometadataConfig = {
	  	headers: {
	  		'Accept': 'application/json;odata=nometadata',
	  		'Content-type': 'application/json;odata=nometadata'
	  	}
	}
  //-----All fixed values have been assigned

  dataService.getLists = function(siteId){
    var spRelativeUrl = findItemById(spSites,siteId).Value;
    return $http({
        method: 'GET',
        url: spUrl+spRelativeUrl+"/_api/web/lists",
        config: nometadataConfig
    });
  }
  
  dataService.getListFields = function(siteId,listTitle){
    var spRelativeUrl = findItemById(spSites,siteId).Value;
    return $http({
        method: 'GET',
        url: spUrl+spRelativeUrl+"/_api/web/lists/getbytitle('"+ listTitle +"')/fields",
        config: nometadataConfig
    });
  }
  
  




  var savedView = null;
  dataService.getModelView = function(){
    return savedView;
  }
  dataService.setModelView = function(view){
    savedView = view;
  }

  return dataService;
});

function findItemById(listItems,itemId){
	var elementPos = listItems.map(function(x) {return x.Id; }).indexOf(itemId);
	return listItems[elementPos];
}