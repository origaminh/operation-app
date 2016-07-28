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
  var spMarketingUrl = "https://edumallinternational.sharepoint.com/marketing";
  var spManagementUrl = "https://edumallinternational.sharepoint.com/management";
  var spResourcesUrl = "https://edumallinternational.sharepoint.com/resources";
  var nometadataConfig = {
	  	headers: {
	  		'Accept': 'application/json;odata=nometadata',
	  		'Content-type': 'application/json;odata=nometadata'
	  	}
	}
  var normalConfig = {
      headers: { "Accept": "application/json; odata=verbose"}
  }
  

  //-----All fixed values have been assigned

  dataService.updateToSP = function(siteId,listName,itemId,data,digestValue,etag){
    // sitId,listName,itemId are for locating the itemId
    // digestValue & etag are required values for updating to SP
    var spRelativeUrl = findItemById(spSites,siteId).Value;
    return $http({
      method: 'POST',
      url: spUrl+spRelativeUrl+"/_api/web/lists/getbytitle('"+listName+"')",
      config: normalConfig
    });
  }

  dataService.getDigestValue = function(siteId){
    var spRelativeUrl = findItemById(spSites,siteId).Value;
    return $http({
      method: 'POST',
      url: spUrl+spRelativeUrl+"/_api/contextinfo",
      config: normalConfig
    });
  }

  dataService.getItemWithTitle = function(siteId,listName,itemId){
    var spRelativeUrl = findItemById(spSites,siteId).Value;
    return $http({
      method: 'GET',
      url: spUrl+spRelativeUrl+"/_api/web/lists/getbytitle('"+listName+"')/items?$select=Id,Title&$filter=Id eq " + itemId,

    });
  }

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
  
  dataService.readCSV = function(url){
    return $http.get(url).then(function(res){
      return csvParser(res.data);
    },function(err){
      console.log(err);
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