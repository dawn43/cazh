const express = require('express')
const path = require("path")
const bodyParser = require('body-parser');
const app = express()
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var mysql = require('mysql');
var cookieParser = require('cookie-parser');
var session = require('express-session');

// Configure MySQL
var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: ''
});
connection.connect(function (err){
	if(err) throw err;
});

app.use(cookieParser())
app.use(session({
	key:'user_id',
	secret: 's3creeT',
	resave: false,
	saveUninitialized: false,
	cookie: {
        expires: 600000
    },
}));

app.use(express.static('public'));
app.set('views', './views');
app.set('view engine', 'pug');

app.get('/login', function(req, res){
	if (!req.session.id) {
		res.redirect('http://localhost:3000/home');
	} else {
		res.render('login', {title:'Login'});
	}
});

app.post('/login/process', urlencodedParser, function(req,res){
	var sess = req.session;
	var username = req.body.username;
	var password = req.body.password;
	var sql = 'SELECT * FROM users WHERE username=? AND password=?';
	connection.query(sql,[username,password],function(error,rows){
		if (error) {
			throw error;
		}
		else if (rows.length>0){
			sess.user_id = rows[0]['id'];
			sess.username = rows[0]['username'];
			sess.is_admin = rows[0]['is_admin'];
			res.redirect('http://localhost:3000/home');
		}
		else if (rows.length==0){
			res.redirect('http://localhost:3000/login');
		}
	});
});

app.get('/logout', function(req,res){
	res.clearCookie('user_id');
	req.session.destroy(function(err){
		if (err) {
			throw err;
		}
		else {
			res.redirect('/login');
		}
	})
});

app.get('/home', function(req,res){
	if(req.session.user_id){
		if (req.session.is_admin==1) {
		    connection.query('SELECT * FROM users WHERE is_admin=0', function (error, rows, fields){
		        if(error){
		            console.log(error)
		        } else{
		        	user = [];
		        	for (var i = 0; i < rows.length; i++) {
			        	user[i] = {
			        		no: i+1,
			        		id: rows[i]['id'],
			        		nama: rows[i]['name'],
			        		kontak: rows[i]['contact'],
			        		jabatan: rows[i]['position'],
			        	}
		        	}
		        }
		        res.render('home', {data:user});
			});
		}
		else{
			connection.query('SELECT * FROM users WHERE id=?',[req.session.user_id], function (error, rows, fields){
		        if(error){
		            console.log(error)
		        } else{
		        	user = {
		        		id: rows[0]['id'],
		        		nama: rows[0]['name'],
		        		kontak: rows[0]['contact'],
		        		jabatan: rows[0]['position'],
		        	}
		        }
		        res.render('staff', {user:user});
			});
		}
	}
	else{
		res.redirect('http://localhost:3000/login');
	}
});

app.get('/add', function(req,res){
	if (req.session.username) {
		if (req.session.is_admin==1) {
			res.render('add_user');
		}
	}
	else{
		res.redirect('http://localhost:3000/login');
	}
});

app.post('/add/simpan', urlencodedParser, function(req,res){
	var name = req.body.name;
	var contact = req.body.contact;
	var position = req.body.position;
	var username = req.body.username;
	var password = req.body.password;
	var sql = 'INSERT INTO users(name, contact, position, username, password, is_admin) VALUES(?,?,?,?,?,?)';
	connection.query(sql, [name, contact, position, username, password, 0], function(error, data){
		var message = [];
		if(error){
			throw error;
		} else {
			res.redirect('http://localhost:3000/add/');
		}
	});
});

app.get('/edit/:id', function(req,res){
	var id = req.params.id;
    if (req.session.username) {
    	if (req.session.is_admin==1) {
			connection.query('SELECT * FROM users WHERE users.id='+id, function (error, rows, fields){
		        if(error){
		            console.log(error)
		        } else{
		        	user = {
		        		id: rows[0]['id'],
		        		nama: rows[0]['name'],
		        		kontak: rows[0]['contact'],
		        		jabatan: rows[0]['position'],
		        	}
		        }
		        res.render('edit_user', {data:user});
			});
    	}
    }
    else{
    	res.redirect('http://localhost:3000/add/');
    }

});

app.post('/edit/:id/simpan', urlencodedParser, function(req,res){
	var id = req.params.id;
	var name = req.body.name;
	var contact = req.body.contact;
	var position = req.body.position;
	var sql = 'UPDATE cazh.users SET name=?, contact=?, position=? WHERE id=?';
	connection.query(sql, [name,contact,position,id], function(error, result){
		if (error) {
			throw error;
		}
		else{
			res.redirect('http://localhost:3000/home');
		}
	});
})

app.get('/delete/:id', function(req,res){
	if (req.session.username) {
		if (req.session.is_admin==1) {
			var id = req.params.id;
			var sql = 'DELETE FROM users WHERE id=?';
			connection.query(sql,[id],function(error,rows){
				if (error) {
					throw error
				} else {
					res.redirect('http://localhost:3000/home');
				}
			});
		}
	}
});

var server = app.listen(3000, function () {
   console.log("Example app listening at localhost:3000")
})