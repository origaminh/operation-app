angular.module('operationApp').directive('formField', function(){
  return {
    restrict: 'A',
    transclude: true,
    scope: { fieldProperties: '='},
    templateUrl: "/frontEnd/html/directives/formField.html",
    link: function(scope, element, attrs){
        
        var parentScope = angular.element( element ).scope().$parent;
        var fieldObj = angular.element( element ).scope().fieldObj;
        scope.fieldChanged = function(){
            parentScope.Form[fieldObj]
            //console.log("Hello")
        }
    }
  }
})
