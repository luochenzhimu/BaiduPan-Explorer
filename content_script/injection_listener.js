// retrieve high speed link
window.addEventListener('hlink1', function(req){
	var fs_id = req.detail.fs_id;
	var isdir = req.detail.isdir;

	// share this file
	share(fs_id, function(res){
		var shareid = res.shareid;

		// after file is shared, visit the shared file page and read yunData from the page
		$.ajax({
			url: res.shorturl,
			success: function(d){

				// parse yunData from js files
				var code = d.match(/yunData\.setData\(.*\)/);
				var data = code[0].substring(16, code[0].length-1);
				var new_yunData = JSON.parse(data);

				// get hlinks and dispatch it
				get_hlink(new_yunData, undefined, undefined, req.detail.index, 1, isdir, [new_yunData.file_list.list[0].fs_id], function(link, index){
					console.log("Link received");
					var event = new CustomEvent("hlink2", {detail: {link: link, index: index}});
					window.dispatchEvent(event);
				})

				// unshare the file
				unshare(new_yunData.shareid, function(){});
			}
		})
	})
})

window.addEventListener('run', function(req){
	// inject code
	injection(req.detail.page);
})

window.addEventListener('verify', function(req){
	// vcode verification
	get_hlink(yunData, 1, req.detail.vcode, req.detail.index, 2, req.detail.isdir, [req.detail.fs_id], function(link, index){
		var event = new CustomEvent("hlink2", {detail: {link: link, index: index}});
		window.dispatchEvent(event);
	});
})
