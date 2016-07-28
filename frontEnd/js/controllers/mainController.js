angular.module('operationApp').controller('MainController', function($scope, $route, $routeParams, $location, $http, dataService) {
  //Bind controller to variable main
  var main = this;

  $scope.$route = $route;
  $scope.$location = $location;
  $scope.$routeParams = $routeParams;

  //Load all defined model views
  $http({
    method: 'GET',
    url: '/data/modelViews.json'
  }).then(function(res){
    $scope.modelViews = res.data;
  },function(err){
    console.log(err);
  });

  main.toggleNavbar = function(){
    $('.navbar-toggle').click();
  }

  main.toggleModelViews = function(){
    // Hide the options after being clicked on
    $('[data-target="#modelViews"]').click();
    $('.navbar-toggle').click();
  }

  main.chooseView = function(view){
    dataService.setModelView(view);
    // Set url location to /modelview if current url is not yet set to this
    // Reload the ng-view with $route.reload if url is alread set to this
    if($location.path() !== '/modelview'){
      $location.path('/modelview');
    } else {
      $route.reload();
    }
  }

  main.getUrl = function(){

    return "http://" +
            window.location.hostname +
            window.location.pathname;
  }

});
