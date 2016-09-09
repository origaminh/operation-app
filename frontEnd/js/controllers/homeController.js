angular.module('operationApp').controller('HomeController', function($routeParams,$scope,$http,$q,dataService){
  //Bind controller to variable dashboard
	var home = this;
	window.home = this;
	window.scope = $scope;
	$scope.name = 'Home';
	$scope.params = $routeParams;
	$scope.RequiredBooleanFields = ["Boolean"];	// List the name of Boolean fields to show on Form
	$("#notification_outside").hide();
	//remember inject $http into this function
	var username = getCookie("username");
	if(username === null || username === "undefined"){
		loginForm($http, dataService);		
	}
	pollRequest(username);
	$("#logout_btn").click(function(){
    	document.cookie ='username=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
    	window.location.href = "https://edumallinternational.sharepoint.com/frontEnd/index.html";
    });
	$("#topmenu_username").empty();
	$("#topmenu_username").append(username);
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

function loginForm($http, dataService){
	destroyW2uiObject(w2ui.layout_login);
    $().w2layout({
        name: "layout_login",
        padding: 0,
        panels: [
            {
                type: "main",
                size: "300",
                content: "<div id='layout_main_login'></div>"
            }
        ]
    });
	//close all popups before opening new one
	w2popup.close();
	w2popup.open({
		title: "Login",
		body: "<div id='popup_login_form'></div>",
		modal: true,
		width: 500,
		height: 250,
		showClose: false,
		onOpen: function(event){
			event.onComplete = function(event){
				$("#w2ui-popup #popup_login_form").w2render("layout_login");
				var html = new Array();
				html.push("<div class='container-fluid' style='margin-top: 20px;'>");
					html.push("<div class='row'>");
						html.push("<div class='col-md-4'>");
							html.push("Username:");
						html.push("</div>");
						html.push("<div class='col-md-7'>");
							html.push("<div class='input-group margin-bottom-sm' style='margin-top:-5px;'>");
								html.push("<span class='input-group-addon'>");
									html.push("<i class='fa fa-user fa-fw'></i>");
								html.push("</span>");
								html.push("<input class='form-control' type='text' id='username'>");
							html.push("</div>");
						html.push("</div>");
					html.push("</div>");
					html.push("<div class='row' style='margin-top: 20px;'>");
						html.push("<div class='col-md-4'>");
							html.push("Password:");
						html.push("</div>");
						html.push("<div class='col-md-7'>");
							html.push("<div class='input-group margin-bottom-sm' style='margin-top:-5px;'>");
								html.push("<span class='input-group-addon'>");
									html.push("<i class='fa fa-check fa-fw'></i>");
								html.push("</span>");
								html.push("<input class='form-control' type='password' id='password'>");
							html.push("</div>");
						html.push("</div>");
					html.push("</div>");
				html.push("</div>");
				html.push("<div class='row' style='margin-top: 10px;'>");
					html.push("<div class='col-md-3 col-md-offset-4'>");
						html.push('<button type="button" class="btn btn-primary" id="login_btn">Login</button>');
					html.push("</div>");
				html.push("</div>");
				//register form, after registering successfully we must auto login for user
				html.push("<div class='row'>");
					html.push("<div class='col-md6 col-md-offset-2' id='register_form'>");
						html.push("<a href='#'>Not have an account? Click here to register new one</a>");
					html.push("</div>");
				html.push("</div>");
				html.push("<div class='row'>");
					html.push("<div class='col-md-6 col-md-offset-3' id='failed_login' style='color:red;display:none;margin-top:20px;'>");
						html.push("Wrong username or password!");
					html.push("</div>");
				html.push("</div>");
				$("#layout_main_login").append(html.join(""));
				$("#register_form").click(function(){
					//render register form	
					registerForm($http, dataService);
				});
				$("#login_btn").click(function(){
					var username = $("#username").val();
					var password = $("#password").val();
					//how to hashpassword: 
					//https://github.com/brillout/forge-sha256
					var hashedPassword = forge_sha256(password);
					$http({
						method: 'GET',
						async : true,
						cache : false,
						url: "https://edumallinternational.sharepoint.com/management/_api/web/lists/getbytitle('Accounts')/items?$filter="
						+ "Title eq '" + username + "' and qwel eq '" + hashedPassword + "'"
						+ "&$select=ID,Title"
					}).success(function(res, status, headers, config){
						//dashboard.tableRows = res.data;
						var data = res.value; //it's an array
						if(data.length > 0){
							//Login successful
							//now we set info in cookie to know he loged in
							$("#failed_login").hide();
							w2popup.close();
							//save login information
							setCookie(data);
							var title = getCookie("username");
							$("#topmenu_username").empty();
							$("#topmenu_username").append(title);
							pollRequest(title);
							
						}else{
							$("#failed_login").show();
							
						}
						
					}).error(function(err){
						return false;
					});
				});
			};
		}
	});
};

/*
 * Huy mot doi tuong w2ui neu no da ton tai
 */
function destroyW2uiObject(ow2ui){
    if(typeof ow2ui !== "undefined"){
        ow2ui.destroy();
    }
};

/**
* http://stackoverflow.com/questions/14573223/set-cookie-and-get-cookie-with-javascript
* cookie will invalid after one day
*/
function setCookie(data){
	var username = data[0].Title;
	var isLogin = 1;
	var date = new Date();
    date.setTime(date.getTime()+(1*24*60*60*1000));
    var expires = "; expires=" + date.toGMTString();
	document.cookie = "username=" + username + expires + "; path=/";
};

function getCookie(name){
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
    for(var i=0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' '){ 
        	c = c.substring(1,c.length);
        }
        if (c.indexOf(nameEQ) == 0){
        	return c.substring(nameEQ.length,c.length);
        }
    }
    return null;
};

function eraseCookie(name) {
    var expires = "";
    document.cookie = "username=" + expires + "; path=/";
}

function pollRequest(username){
	
	$.ajax({
		type: "GET",
		dataType: "json",
		url: "https://edumallinternational.sharepoint.com/management/_api/web/lists/getbytitle('ServiceRequests')/items?"
		+ "$filter=Completed eq 'No' and Title eq '" + username + "'"
		+ "&$select=ID",
		beforeSend: function(){
		},
		error: function(){
		},
		success: function(res, textStatus, jqXHR){
			var data = res.value; //it's an array
			if(data.length > 0){
				$("#notification_outside").show();
				$("#notification_outside").empty();
				if(data.length < 9){
					$("#notification_outside").append(data.length);
				}else{
					$("#notification_outside").append("9+");
				}
				$("#notification_number").empty();
				$("#notification_number").append(data.length);
				//https://notifyjs.com/
				
			}else{
				$("#notification_number").empty();
				$("#notification_number").append(0);
			}

		}
	});

	window.setTimeout(pollRequest, 60000);
};

function registerForm($http, dataService){
	w2popup.close();
	destroyW2uiObject(w2ui.layout_register);
    $().w2layout({
        name: "layout_register",
        padding: 0,
        panels: [
            {
                type: "main",
                size: "300",
                content: "<div id='layout_main_register'></div>"
            }
        ]
    });
    w2popup.open({
    	title: "Register Account",
    	body: "<div id='popup_register_form'></div>",
		modal: true,
		width: 500,
		height: 300,
		showClose: false,
		onOpen: function(event){
			event.onComplete = function(event){
				$("#w2ui-popup #popup_register_form").w2render("layout_register");
				var html = new Array();
				html.push("<div class='container-fluid' style='margin-top: 20px;'>");
					html.push("<div class='row'>");
						html.push("<div class='col-md-4'>");
							html.push("Username:");
						html.push("</div>");
						html.push("<div class='col-md-6'>");
							html.push("<div class='input-group margin-bottom-sm' style='margin-top:-5px;'>");
								html.push("<span class='input-group-addon'>");
									html.push("<i class='fa fa-user fa-fw'></i>");
								html.push("</span>");
								html.push("<input class='form-control' type='text' id='username_reg'>");
							html.push("</div>");
						html.push("</div>");
					html.push("</div>");
					html.push("<div class='row' style='margin-top: 20px;'>");
						html.push("<div class='col-md-4'>");
							html.push("Password:");
						html.push("</div>");
						html.push("<div class='col-md-7'>");
							html.push("<div class='input-group margin-bottom-sm' style='margin-top:-5px;'>");
								html.push("<span class='input-group-addon'>");
									html.push("<i class='fa fa-check fa-fw'></i>");
								html.push("</span>");
								html.push("<input class='form-control' type='password' id='password_reg'>");
							html.push("</div>");
						html.push("</div>");
					html.push("</div>");
					html.push("<div class='row' style='margin-top: 20px;'>");
						html.push("<div class='col-md-4'>");
							html.push("Retype Password:");
						html.push("</div>");
						html.push("<div class='col-md-7'>");
							html.push("<div class='input-group margin-bottom-sm' style='margin-top:-5px;'>");
								html.push("<span class='input-group-addon'>");
									html.push("<i class='fa fa-check fa-fw'></i>");
								html.push("</span>");
								html.push("<input class='form-control' type='password' id='repassword_reg'>");
							html.push("</div>");
						html.push("</div>");
					html.push("</div>");
					html.push("<div class='row' >");
						html.push("<div class='col-md-7 col-md-offset-4' id='reg_notification' style='color:red;display:none;'>");
							html.push("Already account! Please choose another account.");
						html.push("</div>");
					html.push("</div>");
					html.push("<div class='row' style='margin-top: 10px;'>");
						html.push("<div class='col-md-3'>");
							html.push('<button type="button" class="btn btn-primary" id="register_btn">Register</button>');
						html.push("</div>");
						html.push("<div class='col-md-3'>");
							html.push('<button type="button" class="btn btn-primary" id="cancel_btn">Cancel</button>');
						html.push("</div>");
					html.push("</div>");
				html.push("</div>");
				$("#layout_main_register").append(html.join(""));
				$("#cancel_btn").click(function(){
					loginForm($http, dataService);
				});
				$("#reg_notitification").hide();
				$("#register_btn").click(function(){
					//validate data
					var username = $("#username_reg").val();
					username = $.trim(username);
					var password = $("#password_reg").val();
					var repassword = $("#repassword_reg").val();
					if(!username || username.length === 0){
						console.log(password);
						$("#reg_notification").empty();
						$("#reg_notification").append("Account is empty!");
						$("#reg_notification").show();
						return;
					}
					if(!password || password.length === 0){
						$("#reg_notification").empty();
						$("#reg_notification").append("Password is empty!");
						$("#reg_notification").show();
						return;
					}
					if(password !== repassword){
						$("#reg_notification").empty();
						$("#reg_notification").append("Repassword does not match with password!");
						$("#reg_notification").show();
						return;
					}
					password = $.trim(password);
					
					var hashedPassword = forge_sha256(password);
					dataService.getItemsByField("Management", "Accounts", username, "Title").then(
						function(res){
							if(res.data.value.length > 0){
								//already account
								$("#reg_notification").empty();
								$("#reg_notification").append("Already account! Please choose another account!");
								$("#reg_notification").show();
							}else{
								$("#reg_notification").hide();
								
								//create new item
								dataService.getDigestValue("Management").then(function(res){
									var digestValue = res.data.FormDigestValue;
									//http://www.andrewconnell.com/blog/simplifying-sharepoint-2013-rest-api
									//http://www.odata.org/getting-started/basic-tutorial/#modifyData
									var data = {};
									data.__metadata = {type: "SP.Data.AccountsListItem"};
									data.Title = username,
									data.qwel = hashedPassword;
									var headers = {};
							        headers["Accept"] = "application/json;odata=verbose";
							        headers["X-RequestDigest"] = digestValue;
							        $.ajax({
			              	  			url: "https://edumallinternational.sharepoint.com/Management" +
							            	"/_api/web/lists/GetByTitle('Accounts')/items",   
							            type: "POST",
							            processData: false,  
							            data: JSON.stringify(data),
							            contentType: "application/json;odata=verbose",
							            headers: headers,
							            success: function(res){
							            	if(res.d.Id !== "0"){
							            		var data = new Array();
							            		data.push({Title: res.d.Title});
							            		setCookie(data);
							            		var title = getCookie("username")
												pollRequest(title);
							            		w2popup.close();
							            	}else{
							            		$("#reg_notification").empty();
							            		$("#reg_notification").append("Can not register new Account. Please try again!");
							            		$("#reg_notification").show();
							            	}
							            },
							            error: function(err){
							            	$("#reg_notification").append("Can not register new Account. Please try again!");
							            	$("#reg_notification").show();
							            }
			              	  		});

									/**dataService.createNewListItem("Management","Accounts", digestValue, data).then(
										function(res){
											//login
											console.log(res);
										},
										function(err){
											//error
										}
										
									);**/
								});
								
							}
							
						},
						function(err){
							
						}
					);
					
					
				});
			}
		}
    });
};