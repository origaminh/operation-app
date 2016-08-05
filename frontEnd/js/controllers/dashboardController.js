angular.module('operationApp').controller('DashboardController', function($routeParams,$scope,$http,dataService){
  //Bind controller to variable dashboard
  var dashboard = this;

  dashboard.info = dataService.getModelView();
  window.dashboard = dashboard;

  $http({
    method: 'GET',
    url: '/api/tests'
  }).then(function(res){
    //console.log(res);
    dashboard.tableRows = res.data;
  },function(err){
    //console.log(err);
  });

  $scope.name = 'Dashboard';
  $scope.params = $routeParams;

});
