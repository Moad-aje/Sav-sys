const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt-nodejs');
const pdf = require('html-pdf');


const pdfTemplate = require('./documents');


const db = knex({
  client: 'pg',
  connection: {
    connectionString : process.env.DATABASE_URL,
    ssl : true,
 
  }
});

const app = express();
app.use(cors())
app.use(bodyParser.json());

app.get('/',(req,res)=>{res.send('it is working!!')})

app.post('/AddEntreis',(req,res)=>{
	const {Projet , AirCraft, Responsable, dateOfentrie, Statu } = req.body;
	db('generate_audit_number')
	.insert({
		Projet : Projet,
		AirCraft : AirCraft,
		Responsable : Responsable,
		dateOfentrie : new Date(),
		Statu : Statu	
	})
	.select('*').from('generate_audit_number')
	.then(data => {
		res.json(data[0]);
    })
	.catch(err => res.status(400).json('unable to register'))
})

app.get('/GetEnries',(req,res)=> {
	
	db.select('*',knex.raw(`CONCAT('BMMS-AU',id) AS "Audit_Number"`))
	.from('generate_audit_number').then(data=> {
		res.json(data)
	})	
});

app.get('/GetMounument',(req,res)=> {
	db.select('*')
	.from('gcc_sav_systeme')
	.then(data=> {
		res.json(data)
	})	
});

app.get('/GetWorkbooks',(req,res)=> {
	db.select('*')
	.from('gcc_workbooks')
	.then(data=> {
		res.json(data)
	})	
});

app.post('/Test',(req,res)=>{

	const fields = [...req.body]
	console.log(fields)
	const fieldsToInsert = fields.map(field => { 
		return ({
			
			Projet : field.Projet,
			AirCraft : field.AirCraft,
			Responsable_Audit : field.Responsable_Audit,
			dateOfentrie : new Date(),
			Step : field.Step,
			Mounument : field.Mounument,
			Groupe : field.Groupe,
			Responsable : field.Responsable,
			Start_DATE : field.Start_DATE,
			Progression  : field.Progress,
			End_DATE : field.End_DATE,
			Result : field.Result,


			})
	  }); 

	return db('gcc_sav_systeme').insert(fieldsToInsert)
	  	.then(data => {
			res.json(data);
	    })
		.catch(err => res.status(400).json('unable to register'))
})

app.put('/update',(req,res)=> {
	console.log(req.body)
       db('gcc_sav_systeme')
       .where({id : req.body.id})
       .update({
       	Audit_Number : req.body.Audit_Number,
       	// Groupe : req.body.Groupe,
       	Start_DATE : req.body.Start_DATE,
       	Progression : req.body.Progress,
       	End_DATE : req.body.End_DATE,
       	Result : req.body.Result,
       	Commentaire : req.body.Commentaire
       })
       .then(data => {
		res.json(data);
    })
	.catch(err => res.status(400).json('unable to register'))	
});

app.put('/update2',(req,res)=> {
	console.log(req.body)
	db('gcc_workbooks')
	.where({id : req.body.id})
	.update({
       	Conformiter : req.body.Conformiter,
       	LOW_SNAG : req.body.LOW_SNAG.join(),
       	Qty_LowSnag : req.body.LOW_SNAG.length,
       	MEDUIM_SNAG : req.body.MEDUIM_SNAG.join(),
       	Qty_MeduimSnag : req.body.MEDUIM_SNAG.length,
       	HIGHT_SNAG : req.body.HIGHT_SNAG.join(),
       	Qty_HightSnag : req.body.HIGHT_SNAG.length,  	
	})
	.then(data => {
     db.select('Qty_LowSnag','Qty_MeduimSnag','Qty_HightSnag').from('gcc_workbooks')
		.where({
			AIRCRAFT : req.body.AirCraft,
			MONUMENT : req.body.Mounument
		})
		.then(data => {
			const LowSnag = data.reduce((r, {Qty_LowSnag}) => r + Qty_LowSnag, 0);
		    const MeduimSnag = data.reduce((r, {Qty_MeduimSnag}) => r + Qty_MeduimSnag, 0);
		    const HightSnag = data.reduce((r, {Qty_HightSnag}) => r + Qty_HightSnag, 0);
		    const total = 100-(LowSnag*5 + MeduimSnag*10 + HightSnag*20)
			console.log('LowSnag',LowSnag)
			console.log('MeduimSnag',MeduimSnag)
			console.log('HightSnag',HightSnag)
			console.log('total',total)
			db('gcc_sav_systeme')
		    .where({id : req.body.id_moun})
		    .update({
		       	  Result : 100-(LowSnag*5 + MeduimSnag*10 + HightSnag*20),
		    })
		    .then(data => {
		    	res.json(data);
		    })
		})
	})
	.catch(err => res.status(400).json('unable to register'))	
});
// app.put('/update3',(req,res)=> {
// 	console.log(req.body)
//        db('gcc_sav_systeme')
//        .where({id : req.body.id})
//        .update({
//        	Result : req.body.Result,
//        })
//        .then(data => {
// 		res.json(data);
//     })
// 	.catch(err => res.status(400).json('unable to register'))	
// });
// app.put('/Calcule',(req,res)=> {
// 	db.select('Qty_LowSnag','Qty_MeduimSnag','Qty_HightSnag').from('gcc_workbooks')
// 	.where({
// 		AIRCRAFT : req.body.AirCraft,
// 		MONUMENT : req.body.Mounument
// 	})
// 	.then(data => {
// 	const LowSnag = data.reduce((r, {Qty_LowSnag}) => r + Qty_LowSnag, 0);

// 	console.log(data)

// 	})
// })	
app.post('/register',(req,res)=>{
	const {name ,lastname, bnumber, password} = req.body;
    const hash = bcrypt.hashSync(password);
		db('users')
		.insert({
			Name : name,
			LastName:lastname,
			Bnumber : bnumber,
			joined : new Date(),
			hash : hash,
		})
		.select('*').from('users')
		.then(user=> {
			res.json(user[0])
		})
		.catch(err=>res.status(400).json(err))
 
    })

app.post('/signin',(req,res)=>{
	db.select('Bnumber','hash').from('users')
	.where('Bnumber','=',req.body.bnumber)
	.then(data=>{
	const isValid =	bcrypt.compareSync(req.body.password,data[0].hash);
	if (isValid) {
		return db.select('*').from('users')
		.where('Bnumber','=',req.body.bnumber)
		.then(user=>{
			res.json(user[0])
		}).catch(err=>res.status(400).json('unable to get user'))
	} else {
	res.status(400).json('worng credentials')	
	}
	})
	.catch(err=>res.status(400).json('worng credentials'))
})	

app.post('/create-pdf', (req, res) => {
	console.log(req.body)
	db.select('AIRCRAFT','LIVRABLES','TYPOLOGIE','LOW_SNAG','Qty_LowSnag','MEDUIM_SNAG','Qty_MeduimSnag','HIGHT_SNAG','Qty_HightSnag').from('gcc_workbooks')
	.where({
		AIRCRAFT : req.body.AirCraft,
		MONUMENT : req.body.Mounument,
		Conformiter : 'NON CONFORME'
	})
		.then(data =>{
			const NcWorkbooks = data
			console.log('in server',NcWorkbooks)
			// pdfTemplate(req.body,NcWorkbooks)
		pdf.create(pdfTemplate(req.body,NcWorkbooks), {}).toFile('result.pdf', (err) => {
        if(err) {
            res.send(Promise.reject());
        }

        res.send(Promise.resolve());
    });
});

app.get('/fetch-pdf', (req, res) => {
    res.sendFile(`${__dirname}/result.pdf`)
		})
})


app.listen(process.env.PORT || 3001,()=>{
	console.log(`app is running on port ${process.env.PORT}`)
})