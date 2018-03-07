var app = angular.module('app', []);
app.controller('control', function($scope, $http){
	// initialize angular model
	$scope.message = 'pan.baidu.com only';
	$scope.status = false;
	$scope.page = 1;
	$scope.vcodes = [];
	$scope.vcode_input = "";
	$scope.bduss;

	chrome.cookies.get({url: 'https://pan.baidu.com/', name: 'BDUSS'}, function(cookie){
		$scope.$apply(function(){
			$scope.bduss = cookie? cookie.value: '';
		})
	})

	// function to generate high speed links
	$scope.generate = function(i){
		console.log(i);
		$scope.message = "Running...";
		var x = $scope.links[i];
		var fs_id = x.fs_id;
		var isdir = x.isdir;
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {fs_id: fs_id, index: i, isdir: isdir});
		});
	}
	// generate hlinks for all files
	$scope.generateAll = function(){
		for(var i=0; i<$scope.links.length; i++){
			if(!$scope.links[i].hlink)$scope.generate(i);
		}
	}
	
	// previous page
	$scope.prev = function(){
		if($scope.page == 1){
			$scope.message = "Already the first page";
			return
		}
		$scope.page -= 1;
		$scope.run();
	}
	// next page
	$scope.next = function(){
		if($scope.links.length < 100){
			$scope.message = "Already the last page";
			return
		}
		$scope.page += 1;
		$scope.run();
	}

	// run
	$scope.run = function(){
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			var url = tabs[0].url;
			chrome.tabs.sendMessage(tabs[0].id, {page: $scope.page}, function(res){
				$scope.$apply(function(){$scope.message = "Ready."});
			})
		})
	}

	// create a hidden input for copy
	var body = angular.element(document.body);
	var textarea = angular.element('<textarea/>');
	textarea.css({
		position: 'fixed',
		opacity: '0'
	});
	body.append(textarea);
	
	// copy links to clipboard
	$scope.copy = function(i, type){
		if(type=='hlink')textarea.val($scope.links[i].hlink)
		else textarea.val($scope.links[i].dlink)
		if(!textarea.val()){
			$scope.message = "This field is empty"
			return
		}
		textarea[0].select()
		if(document.execCommand("copy"))$scope.message = "Copy success";
		else $scope.message = "Copy failure"
	}
	$scope.copyAll = function(type){
		var text = "";
		for(var i=0; i<$scope.links.length; i++){
			if(type == 'dlink'){
				if(!$scope.links[i].dlink)continue
				text += $scope.links[i].dlink+'\n';
			}
			else{
				if(!$scope.links[i].hlink)continue
				text += $scope.links[i].hlink+'\n';
			}
		}
		textarea.val(text);
		if(!textarea.val()){
			$scope.message = "No links";
			return;
		}
		textarea[0].select()
		if(document.execCommand("copy"))$scope.message = "Copy all success";
		else $scope.message = "Copy failure"
	}

	// do vcode verification
	$scope.verify = function(vcode_str, vcode_input, index){
		var x = $scope.links[index];
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {vcode: {vcode_str: vcode_str, vcode_input: vcode_input}, index: index, fs_id: x.fs_id, isdir: x.isdir});
			$scope.$apply(function(){
				var vcodes = $scope.vcodes.filter(function(e){
					return e.vcode_str != vcode_str;
				})
				$scope.vcodes = vcodes;
			});
		});
	}

	$scope.clear = function(){
		chrome.storage.local.remove('data');
		$scope.message = "Cache is cleared";
	}

	$scope.download = function(index){
		if(!$scope.links[index].hlink){
			$scope.message = 'hlink is not generated';
			return;
		}
		$http.get('http://127.0.0.1:8333/rpc?link='+btoa($scope.links[index].glink)+'&bduss='+$scope.bduss)
		.then(function(res){
			$scope.message = 'Done';
		}, function(res){
			$scope.message = 'Fail to download. Make sure `aria2` is installed and `baidudl_rpc` is running';
		});
	}
})

