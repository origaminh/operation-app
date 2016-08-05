angular.module('operationApp').directive('formField', function(){
  return {
    restrict: 'A',
    replace: true,
    scope: { fieldProperties: '=' },
    templateUrl: "/frontEnd/html/directives/formField.html",
    link: function(scope, element, attrs, ctrl){
        
        scope.displayTitle = function(){
        	return scope.$parent.fieldObj.Title;
        }
        console.log(scope.fieldProperties);
        var parentScope = angular.element( element ).scope();
        //var home = 
        scope.fieldChanged = function(){
            console.log("Hello")
        }
    }
  }
})
