/**
 * Created by Minh on 4/1/2016.
 */
//moment.locale('vi');
angular.module('operationApp',['ngRoute','DataService','UtilityService']).config(function($routeProvider, $locationProvider) {
    $routeProvider.when('/', {
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