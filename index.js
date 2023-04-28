const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const exphbs = require('express-handlebars')
const port = process.env.PORT || 8000
const { celebrate, Joi } = require('celebrate');
const app = express()
const Sale = require('./models/Supplies')
// registering the bodyparser
app.use(bodyParser.urlencoded({ 'extended': 'true' }));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());


// get settings from config file
// const settings = require('./config/settings')
// const db = settings.mongoDBUrl

//get settings fro environment variable
require('dotenv').config()
const db = process.env.mongoDBUrl

/**
 * Adding middleware to serve static files.
 */
var path = require('path');//include path module using require method
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

const Handlebars = require('handlebars')
const expressHandlebars = require('express-handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access')

app.engine('.hbs', expressHandlebars.engine({
    handlebars: allowInsecurePrototypeAccess(Handlebars), extname: '.hbs'
}));
app.set('view engine', '.hbs');

/*
@type     -   GET
@route    -   /api/search
@desc     -  It will display the search page to the client for providing search criteria
@access   -   PUBLIC
*/
app.get('/api/search', (req, res, next) => {
    res.render('search');
});

// enable CORS for all routes and for our specific API-Key header
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, API-Key')
    next()
  })
  

// PROTECT ALL ROUTES THAT FOLLOW This
app.use((req, res, next) => {
    const apiKey = req.get('API-Key')
    if (!apiKey || apiKey !== process.env.API_KEY) {
      res.status(401).json({error: 'You are not authorized to access this resource.'})
    } else {
      next()
    }
  })

// attempt to connect with DB. 
//Only start the server if the DB connection has succeeded, otherwise show error in the console
mongoose
    .connect(db)
    .then(() => {
        console.log('MongoDB connected successfully.');
        app.listen(port, () => console.log(`App running at port : ${port}`))
    }
    ).catch((err) => {
        console.log('Server could not be started');
        console.log(err);
    })


    app.get('/', (req, res) => {
        res.send('Project is Running')
    })
    
    // Get sales routes
    const apiRoutes = require('./routes/api/routes')
    
    // mapping the imported routes
    app.use('/api/', apiRoutes)
    




/*
@type     -   POST
@route    -   /api/search
@desc     -  It will use these values to return all "sales" objects for a specific "page" to the client as well as optionally filtering by "storeLocation", if provided
@access   -   PROTECTED
*/
app.post('/api/search', celebrate({
    body: Joi.object().keys({
        page: Joi.number().integer().min(1).required(),
        perPage: Joi.number().integer().min(1).required(),
        storeLocation: Joi.string().allow('')
    })
}), async (req, res) => {
    try {
        const { page, perPage, storeLocation } = req.body;
        // use the query params to filter and paginate sales data
        let query = {};
        if (storeLocation) {
            query.storeLocation = storeLocation;
        }
        const count = await Sale.countDocuments(query);
        const totalPages = Math.ceil(count / perPage);

        // handle edge cases
        if (page > totalPages) {
            return res.status(400).json({ message: 'Invalid page value' });
        }
        if (perPage > 100) {
            return res.status(400).json({ message: 'perPage value too large' });
        }
        const sales = await Sale.find(query)
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();
        res.render('display', { data: sales }); // return all sales in JSON format and display on the template engine
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


