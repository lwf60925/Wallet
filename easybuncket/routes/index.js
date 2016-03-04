var crypto = require('crypto');
var User = require('../modules/user.js');
var Consume = require('../modules/consume.js');
var Income=require('../modules/income.js');
/*
 * GET home page.
 */

module.exports = function(app) {
	app.get('/',function(req, res){
		res.render('index', { title: '首页' });
	});

	app.get('/chart', function (req, res) {
		var user=req.session.user;
		res.render('chart',{title:'消费图表'});
	})


	app.get('/charts', function (req, res) {
		var user=req.session.user;
		res.render('charts',{title:'收入图表'});
	})


	//app.get('/home',function(req,res){
	//	var user=req.session.user;
	//	res.render('home',{title:'主页'});
	//})

	app.get('/home',function(req,res){
		var user = req.session.user;
		Consume.stat(user.name, function(err, consumeresults) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/error');
			}
			res.render('home', {
				title: user.name,
				consumeresults: consumeresults,
			});
		});
	});

	//app.get('/incomestat',function(req,res){
	//	var user = req.session.user;
	//	Income.incomestat(user.name, function(err, incomeresults) {
	//		if (err) {
	//			req.flash('error', err);
	//			return res.redirect('/error');
	//		}
	//		res.render('home', {
	//			title: user.name,
	//			incomeresults: incomeresults,
	//		});
	//




//consume
	app.get('/record',function(req,res){
		var user = req.session.user;
		if(!user){
			req.flash('error', '用户未登录，请登录。');
			return res.redirect('/login');
		}

		var pageindex = req.body.pageindex;
		if(!pageindex)pageindex=1;
		var keyword=req.param("keyword");
		if(!keyword){
			keyword="";
		}

		Consume.get(user.name,{pageindex:pageindex,keyword:keyword}, function(err, records,count) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/error');
			}
			Consume.getSubject(user.name,function(err,subjects){
				if (err) {
					req.flash('error', err);
					return res.redirect('/error');
				}
				res.render('record', {
					title: user.name,
					consumes: records,
					keyword:keyword,
					subjects:subjects,
					count:count,
					pageindex:1,
					keyword:keyword,
				});
			});
		});
	});


//收入
	app.get('/income',function(req,res){
		var user = req.session.user;
		if(!user){
			req.flash('error', '用户未登录，请登录。');
			return res.redirect('/login');
		}

		var pageindex = req.body.pageindex;
		if(!pageindex)pageindex=1;
		var keyword=req.param("keyword");
		if(!keyword){
			keyword="";
		}

		Income.get(user.name,{pageindex:pageindex,keyword:keyword}, function(err, records,count) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/error');
			}
			Income.getSubject(user.name,function(err,subjects){
				if (err) {
					req.flash('error', err);
					return res.redirect('/error');
				}
				res.render('income', {
					title: user.name,
					incomes: records,
					keyword:keyword,
					subjects:subjects,
					count:count,
					pageindex:1,
					keyword:keyword,
				});
			});
		});
	});

	//预处理，如果通过，再进行下一个。
	app.post('/record',checkLogin);

	app.post('/record', function(req, res) {
		var currentUser = req.session.user;
		var record = new Consume();
		record.loadFromReq(currentUser.name, req.body);
		if(!req.body.consumeDate){
			res.redirect('/record');
			return;
		}
		record.save(function(err) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/record');
			}
			var keyword = req.body.keyword;
			if(!keyword)keyword="";
			req.flash('success', '发表成功');
			res.redirect('/record?keyword='+keyword);
		});
	});



	app.post('/income',checkLogin);

	app.post('/income', function(req, res) {
		var currentUser = req.session.user;
		var record = new Income();
		record.loadFromReq(currentUser.name, req.body);
		if(!req.body.incomeDate){
			res.redirect('/income');
			return;
		}
		record.save(function(err) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/income');
			}
			var keyword = req.body.keyword;
			if(!keyword)keyword="";
			req.flash('success', '发表成功');
			res.redirect('/income?keyword='+keyword);
		});
	});

	//可以查看其他用户的数据
	app.get('/u/:user', function(req, res) {
		var username = req.params.user;
		if (!username) {
			req.flash('error', '未指定用户');
			return res.redirect('/error');
		}
//显示全部数据
		Consume.get(username,{}, function(err, records,count) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/error');
			}
			console.log(records);
			res.render('list', {
				title: username,
				consumes: records,
				count:count,
			});
		});

		Income.get(username,{}, function(err, records,count) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/error');
			}
			console.log(records);
			res.render('listIncome', {
				title: username,
				incomes: records,
				count:count,
			});
		});

	});

	app.get('/del/:id', function(req, res) {
		var id = req.params.id;
		if (!id) {
			req.flash('error', '未指定要删除的记录ID');
			return res.redirect('/error');
		}

		console.log("准备删除记账记录，_id="+id);

		Consume.del(id, function(err, records) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/error');
			}
			res.redirect('/record');
		});

		Income.del(id, function(err, records) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/error');
			}
			res.redirect('/income');
		});
	});

	app.get('/logout',function(req,res){
		req.session.user = null;
		req.flash('success','登出成功');
		res.redirect('/login');
	});

	//定义一个函数，被两个方法调用
	var list = function(req,res){
		var user = req.session.user;
		if(!user){
			req.flash('error', "您没有登录，请登录。");
			console.log("没有登录，重定向的登录界面。");
			return res.redirect('/login');
		}
		var pageindex = req.body.pageindex;
		if(!pageindex)pageindex=1;
		Consume.get(user.name,{pageindex:pageindex}, function(err, records,count) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/error');
			}
			res.render('list', {
				title: user.name,
				consumes: records,
				count:count,
				pageindex:pageindex,
			});
		});
	};


	var listIncome = function(req,res){
		var user = req.session.user;
		if(!user){
			req.flash('error', "您没有登录，请登录。");
			console.log("没有登录，重定向的登录界面。");
			return res.redirect('/login');
		}
		var pageindex = req.body.pageindex;
		if(!pageindex)pageindex=1;
		Income.get(user.name,{pageindex:pageindex}, function(err, records,count) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/error');
			}
			res.render('listIncome', {
				title: user.name,
				incomes: records,
				count:count,
				pageindex:pageindex,
			});
		});
	};

	app.get('/list',list);
	app.post('/list',list);

	app.get('/listIncome',listIncome);
	app.post('/listIncome',listIncome);



	//消费
	app.post('/search',function(req,res){
		var user = req.session.user;
		if(!user){
			req.flash('error', "您没有登录，请登录。");
			return res.redirect('/login');
		}
		var keyword = req.body.keyword;
		if(!keyword)keyword="";
		console.log("搜索关键字："+keyword);
		var pageindex = req.body.pageindex;
		if(!pageindex)pageindex=1;
		Consume.get(user.name,{pageindex:pageindex,keyword:keyword}, function(err, records,count) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/error');
			}
			Consume.getSubject(user.name,function(err,subjects){
				if (err) {
					req.flash('error', err);
					return res.redirect('/error');
				}
				res.render('record', {
					title: user.name,
					consumes: records,
					subjects:subjects,
					count:count,
					pageindex:pageindex,
					keyword:keyword,
				});
			});
		});
	});
//收入
	app.post('/incomesearch',function(req,res){
		var user = req.session.user;
		if(!user){
			req.flash('error', "您没有登录，请登录。");
			return res.redirect('/login');
		}
		var keyword = req.body.keyword;
		if(!keyword)keyword="";
		console.log("搜索关键字："+keyword);
		var pageindex = req.body.pageindex;
		if(!pageindex)pageindex=1;
		Income.get(user.name,{pageindex:pageindex,keyword:keyword}, function(err, records,count) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/error');
			}
			Income.getSubject(user.name,function(err,subjects){
				if (err) {
					req.flash('error', err);
					return res.redirect('/error');
				}
				res.render('income', {
					title: user.name,
					incomes: records,
					subjects:subjects,
					count:count,
					pageindex:pageindex,
					keyword:keyword,
				});
			});
		});
	});




//收入
	app.get('/incomestat',function(req,res){
		var user = req.session.user;
		Income.incomestat(user.name, function(err, incomeresults) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/error');
			}
			res.render('incomestat', {
				title: user.name,
				incomeresults: incomeresults,
			});
		});
	});

//消费	
	app.get('/stat',function(req,res){
		var user = req.session.user;
		Consume.stat(user.name, function(err, consumeresults) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/error');
			}
			res.render('stat', {
				title: user.name,
				consumeresults: consumeresults,
			});
		});
	});

	app.get('/month',function(req,res){
		var user = req.session.user;
		Consume.month(user.name, function(err, consumeresults) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/error');
			}
			res.render('stat', {
				title: user.name,
				consumeresults: consumeresults,
			});
		});
	});


	app.get('/incomemonth',function(req,res){
		var user = req.session.user;
		Income.month(user.name, function(err, incomeresults) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/error');
			}
			res.render('incomestat', {
				title: user.name,
				incomeresults: incomeresults,
			});
		});
	});

	app.get('/error',function(req,res){
		res.render('error');
	});

	//处理用户登录。
	app.post('/login',function(req,res){
		var md5=crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('hex');

		User.get(req.body.username,function(err,user){
			if(!user){
				req.flash('error','用户不存在');
				return res.redirect('/login');
			}

			if(user.password!=password){
				req.flash('error','用户口令错误');
				return res.redirect('/login');
			}

			req.session.user = user;
			req.flash('success','登入成功');
			//res.redirect('/');
			res.redirect('/home');
		});
	});

	app.get('/login',function(req,res){
		res.render('login',{
			title:'用户登录',
		});
	});

	app.get('/reg',function(req,res){

		res.render('reg',{
			title:'用户注册'
		});
	});

	app.post('/reg',function(req,res){
		if(req.body['password-repeat']!=req.body['password']){
			req.flash('error','两次输入的口令不一致！');
			return res.redirect('/reg');
		}

		var md5=crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('hex');

		var newUser = new User({
			name:req.body.username,
			password:password,
		});

		User.get(newUser.name,function(err,user){
			if(user)
				err='同名用户已经存在，请更换名字.';
			if(err){
				req.flash('error',err);
				return res.redirect('/reg');
			}

			newUser.save(function(err){
				if(err){
					req.error=err;
					return res.redirect('/reg');
				}
				req.session.user = newUser;
				req.flash('success','注册成功！');
				res.redirect('/index');
			});
		});
	});

	//测试函数，跳转到指定的模板
	app.get('/ejs/:name',function(req,res){
		var name = req.params.name;
		console.log("参数："+name);
		console.log("类型："+typeof name);
		if(name == undefined || name=="" || name==null){
			res.redirect('/');
		}
		else{
			res.render(name);
		}
	});

	//测试函数，跳转到指定的模板
	app.get('/test/:name/:pageindex',function(req,res){
		var name = req.params.name;
		console.log("参数："+name);
		console.log("类型："+typeof name);
		if(name == undefined || name=="" || name==null){
			res.redirect('/');
		}
		else{
			var count = 0;
			Consume.count('wlm',function(err,count){
				res.render(name,{count:count});
			});
		}
	});

	//测试函数
	app.get('/hello',function(req,res){
		res.send('The time is '+new Date().toString());
	});

	//测试函数
	app.get('/sayhello',function(req,res){
		res.send('hello '+req.params.username);
	});

};

//检查是否登入.
function checkLogin(req, res, next) {
	if (!req.session.user) {
		req.flash('error', '尚未登录，无法操作。');
		return res.redirect('/error');
	}
	next();
}

function checkNotLogin(req, res, next) {
	if (req.session.user) {
		req.flash('error', '已登入');
		return res.redirect('/');
	}
	next();
}