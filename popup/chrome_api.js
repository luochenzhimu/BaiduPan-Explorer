// refine hlink
chrome.webRequest.onHeadersReceived.addListener(
	function(details){
		var $scope = angular.element(document.getElementById('app')).scope();
		var hlink;

		// get download link
		for(var i=0; i<details.responseHeaders.length; i++){
			if(details.responseHeaders[i].name == 'Location'){
				hlink = details.responseHeaders[i].value;
				break;
			}
		}

		// parse index
		var url = new URL(details.url);
		var index = parseInt(url.hash.substr(1,url.hash.length));

		// refine download link
		var url = new URL(hlink);
		url.host = 'd11.baidupcs.com';
		hlink = url.href;

		// display link
		$scope.$apply(function(){
			$scope.links[index].hlink = hlink;
			$scope.links[index].glink = details.url;
			$scope.message = "Ready."
		})

		// save state
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
			chrome.storage.local.set({'data': {url: tabs[0].url, timestamp: Number(new Date()), links: $scope.links, page: $scope.page}})
		})
	},
	{urls: ["https://d.pcs.baidu.com/file/*", "http://d.pcs.baidu.com/file/*"]},
	['responseHeaders']
)
chrome.webRequest.onBeforeSendHeaders.addListener(
	function(details){
		var headers = details.requestHeaders;
		var index = -1;
		for(var i=0; i<headers.length; i++){
			if(headers[i].name == 'Cookie'){
				index = i;
				break;
			}
		}
		if(index >= 0){
			headers.splice(index, 1)
		}

		return {'requestHeaders': headers}
	},
	{urls: ["https://d.pcs.baidu.com/file/*", "http://d.pcs.baidu.com/file/*"]},
	['blocking', 'requestHeaders']
)

// add listener to handle received message
chrome.runtime.onMessage.addListener(function(req, sender, sendResponse){
	var $scope = angular.element(document.getElementById('app')).scope();
	if(req.type == "dlink"){
		$scope.$apply(function(){
			$scope.links = req.result;
			$scope.status = true;
		});
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
			chrome.storage.local.set({'data': {url: tabs[0].url, timestamp: Number(new Date()), links: $scope.links, page: $scope.page}})
		})
		sendResponse('Success');
	}
	if(req.type == "hlink2"){
		var hlink = req.result.link;
		var index = req.result.index;
		var url = new URL(hlink);
		if(url.host == 'd.pcs.baidu.com'){
			$http = angular.injector(["ng"]).get("$http");
			$http.head(hlink+'#'+index);
		}
		else{
			$scope.$apply(function(){
				$scope.links[index].hlink = hlink;
				$scope.links[index].glink = false;
				$scope.message = "Ready."
			})
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
				chrome.storage.local.set({'data': {url: tabs[0].url, timestamp: Number(new Date()), links: $scope.links, page: $scope.page}})
			})
		}
	}
	if(req.type == "error"){
		$scope.$apply(function(){
			$scope.message = req.result;
		})
	}

	if(req.type == "vcode"){
		$scope.$apply(function(){
			$scope.vcodes.push({vcode_str: req.result.vcode, index: req.result.index})
			$scope.message = "vcode required...";
		})
	}
})

// execute content script
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	var url = tabs[0].url;
	try{
		var domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
		console.log(domain);
		if(domain == 'pan.baidu.com'){
			var $scope = angular.element(document.getElementById('app')).scope();
			$scope.$apply(function(){$scope.message = "Ready."});
			chrome.tabs.sendMessage(tabs[0].id, {greeting: "yes"}, function(response) {
				if(!response){
					chrome.tabs.executeScript({file: "content_script/sandbox.js"}, function(){
						check_storage(tabs, url, 1);
					})
				}else{
					check_storage(tabs, url, $scope.page);
				}
			})
		}
	}catch(err){
		console.log(err);
	}
});

// manipulate chrome storage
function check_storage(tabs, url, page){
	chrome.storage.local.get('data', function(result){
		var flag = 0;
		var data;
		if('data' in result){
			data = result.data;
		}
		else{
			flag = 1;
			data = {}
		}
		if(!data)flag=1;
		if('url' in data && url != data.url)flag = 1;
		if('timestamp' in data && Number(new Date()) - data.timestamp > 5*60*1000)flag = 1;
		if('page' in data && page != data.page)flag = 1;
		if(flag == 1)chrome.tabs.sendMessage(tabs[0].id, {page: page});
		else{
			var $scope = angular.element(document.getElementById('app')).scope();
			setTimeout(function(){
				$scope.$apply(function(){
					$scope.status = true;
					$scope.links = data.links;
				})
			}, 300)
		}
	});
}
