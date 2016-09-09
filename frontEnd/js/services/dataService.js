angular.module('DataService',[]).factory('dataService', function($http){
  var dataService = {};

  var spSites = [
    {Id: "Top",Value:"",Title:"Operation Site"},
    {Id: "Marketing",Value:"/marketing",Title:"Marketing Site"},
    {Id: "Management",Value:"/management",Title:"Management Site"},
    {Id: "Resources",Value:"/resources",Title:"Resources Site"}
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
  dataService.getDigestValue = function(siteId){
    var spRelativeUrl = findItemById(spSites,siteId).Value;
    return $http({
      method: 'POST',
      url: spUrl+spRelativeUrl+"/_api/contextinfo",
      config: normalConfig
    });
  }

  //-----All fixed values and functions have been assigned

  dataService.updateToSP = function(siteId,listName,digestValue,etag,data,itemId){
    // sitId,listName,itemId are for locating the itemId
    // digestValue & etag are required values for updating to SP
    var spRelativeUrl = findItemById(spSites,siteId).Value;
    return $http({
      method: 'POST',
      url: spUrl+spRelativeUrl+"/_api/web/lists/getbytitle('"+listName+"')",
      config: normalConfig
    });
  }

  dataService.postJson = function(siteId,listName,digestValue,data,itemId){
    var spRelativeUrl = findItemById(spSites,siteId).Value;
    var headers = {};
    headers["Accept"] = "application/json;odata=verbose";
    headers["Content-Type"] = "application/json;odata=verbose";
    headers["X-RequestDigest"] = digestValue;
    if(itemId) { // No itemId value indicates creating new List item
      headers["X-HTTP-Method"] = "MERGE";
      headers["If-Match"] = "*";
    }
    return $http({
      method: 'POST',
      url: spUrl+spRelativeUrl+"/_api/web/lists/getbytitle('"+listName+"')/items",
      config: {
          headers: headers,
      },
      data: JSON.stringify(data)
    });
  }


  dataService.createNewListItem = function(siteId,listName,digestValue,data){
    var spRelativeUrl = findItemById(spSites,siteId).Value;
	
	var headers = {};
	  headers["Content-Type"] = "application/json;odata=verbose";
	  headers["Accept"] = "application/json;odata=verbose";
	  headers["X-RequestDigest"] = digestValue;
	
	
    return $http({
      method: 'POST',
      url: spUrl+spRelativeUrl+"/_api/web/lists/getbytitle('"+listName+"')/items",
      config: {
          headers: headers ,
      },
      data: JSON.stringify(data)
    });
  }

  dataService.getRecentItems = function(siteId,listName,fields){
    var spRelativeUrl = findItemById(spSites,siteId).Value;
    var fieldsInUrl = fields ? fields.join(",") : "Id,Title"
    return $http({
      method: 'GET',
      url: spUrl+spRelativeUrl+"/_api/web/lists/getbytitle('"+listName+"')/items?$select="+
      fieldsInUrl+"&$orderBy=Id desc&$top=5000",
      config: nometadataConfig
    });
  }

  dataService.getRecentItemsByListGuid = function(siteId,listGuid,fields){
    var spRelativeUrl = findItemById(spSites,siteId).Value;
    var fieldsInUrl = fields ? fields.join(",") : "Id,Title"
    return $http({
      method: 'GET',
      url: spUrl+spRelativeUrl+"/_api/web/lists('"+listGuid+"')/items?$select="+
      fieldsInUrl+"&$orderBy=Id desc&$top=5000",
      config: nometadataConfig
    });
  }

  dataService.getItemsByField = function(siteId,listName,indexedValue,indexedField){
    var spRelativeUrl = findItemById(spSites,siteId).Value;
    if (typeof indexedValue != "number"){
    	indexedValue = "'" + indexedValue + "'";
    }
    return $http({
      method: 'GET',
      url: spUrl+spRelativeUrl+"/_api/web/lists/getbytitle('"+listName+"')/items?$select=Id,Title"+
      "&$filter="+ indexedField +" eq " + indexedValue,
      config: nometadataConfig
    });
  }

  dataService.getLists = function(siteId){
  	if (!findItemById(spSites,siteId)){ debugger }
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
  
  dataService.getListItems = function(siteId,listTitle,minId,maxId){
    var spRelativeUrl = findItemById(spSites,siteId).Value;
    minId = minId ? minId : 1;
    maxId = maxId ? maxId : 5000;
    return $http({
        method: 'GET',
        url: spUrl+spRelativeUrl+"/_api/web/lists/getbytitle('"+ listTitle +
        "')/items?$filter=Id gt "+(minId-1)+" and Id lt "+(maxId+1)+"&$top=5000",
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