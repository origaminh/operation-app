//moment.locale('vi');
angular.module('operationApp',['ngRoute','DataService','UtilityService']).config(function($routeProvider, $locationProvider) {
    $routeProvider.when('/', {
      templateUrl: 'html/templates/home.html',
      controller: 'HomeController',
      controllerAs: 'home',
      resolve: {}
    }).when('/dashboard',{
      templateUrl: 'html/templates/dashboard.html',
      controller: 'DashboardController',
      controllerAs: 'dashboard',
      resolve: {}
    }).when('/modelview',{
      templateUrl: 'html/templates/modelView.html',
      controller: 'ModelViewController',
      controllerAs: 'mv',
      resolve: {}
    }).when('/importdata',{
      templateUrl: 'html/templates/importData.html',
      controller: 'ImportDataController',
      controllerAs: 'importData',
      resolve: {}
    });

    // configure html5 to get links working on jsfiddle
    //$locationProvider.html5Mode(true);
  });

function findItemById(listItems,itemId){
	var elementPos = listItems.map(function(x) {return x.Id; }).indexOf(itemId);
	return listItems[elementPos];
}
function findItemByField(listItems,lookupValue,field){
	var elementPos = listItems.map(function(x) {return x[field]; }).indexOf(lookupValue);
	return listItems[elementPos];
}
function findItemsByField(listItems,lookupParams){
  // lookupParams is in the form of [{"Field":"testValue","Value":false}]
	var result = [];
  listItems.forEach(function(item){
    var matched = false;
    lookupParams.forEach(function(param){
      if(item[param.Field] == param.Value){
        matched = true;
      };
    })
    if(matched){ result.push(item); }
  });
	return result;
}
function unify(str){
  var newStr = "";
  for (var i = 0, len = str.length; i < len; i++) {
    if(str[i] && str[i].charCodeAt() != 13 ){
      newStr = newStr+str[i];
    }
  }
  return newStr;
}
function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}
var specialChars = [{Normal:"#",UTF:"%23"},{Normal:"&",UTF:"%26"},{Normal:"'",UTF:"%27%27"},{Normal:"+",UTF:"%2B"}];
function formatAsUri(str){
	var processedStr = "";
	for (var i = 0, len = str.length; i < len; i++) {
	  if( findItemByField(specialChars,str[i],"Normal") ){
	  	processedStr = processedStr.concat(findItemByField(specialChars,str[i],"Normal").UTF)
	  } else {
	  	processedStr = processedStr.concat(str[i])
	  }
	}
	return processedStr;
}