const express = require('express')
const router = express.Router()
const { celebrate, Joi } = require('celebrate');
// Import Sales schema
const Sale = require('../../models/Supplies')

//@type     -   GET
//@route    -   /api
//@desc     -   Just for testing
//@access   -   PROTECTED
router.get('/', (req, res) => res.send('Sales related routes'))


//@type     -   POST
//@route    -   /api/sales
//@desc     -   Insert a sales record
//@access   -   PROTECTED
router.post('/sales', async (req, res) => {
    try {
        const {
            saleDate,
            items,
            storeLocation,
            customer,
            couponUsed,
            purchaseMethod
        } = req.body;
        // check required fields
        if (!saleDate || !items || !storeLocation || !customer || !('age' in customer) || !customer.gender || !customer.email || !('satisfaction' in customer) || !couponUsed || !purchaseMethod) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        // parse fields
        const age = parseInt(customer.age);
        const satisfaction = parseInt(customer.satisfaction);
        const sale = new Sale({
            saleDate,
            items,
            storeLocation,
            customer: {
                ...customer,
                age,
                satisfaction
            },
            couponUsed,
            purchaseMethod
        });
        const savedSale = await sale.save();
        res.status(201).json(savedSale); // Send back the new sale as JSON with a status code of 201
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal server error' })
    }
})

/*
@type     -   GET
@route    -   /api/sales
@desc     -  It will use these values to return all "sales" objects for a specific "page" to the client as well as optionally filtering by "storeLocation", if provided
@access   -   PROTECTED
*/
router.get('/sales', celebrate({
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).required(),
        perPage: Joi.number().integer().min(1).required(),
        storeLocation: Joi.string().allow('')
    })
}), async (req, res) => {
    try {
        const { page, perPage, storeLocation } = req.query;

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

        res.json({
            data: sales,
            currentPage: page,
            totalPages: totalPages,
            totalRecords: count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/*
@type     -   GET
@route    -   /api/sales/:id
@desc     -   It will return specific sales object for a specific  id
@access   -   PROTECTED
*/
router.get('/sales/:id', async (req, res) => {
    try {
        const sale = await Sale.findOne({ _id: req.params.id }).exec();
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }
        res.json(sale);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

/*
@type     -   PUT
@route    -   /api/sales/:id
@desc     -  It will use the values provided in the request body to update a specific "sales" document in thecollection and return a success / fail message to the client.
@access   -   PROTECTED
*/
router.put('/sales/:id', async (req, res) => {
    try {
        const {
            saleDate,
            items,
            storeLocation,
            customer,
            couponUsed,
            purchaseMethod
        } = req.body;
        // check required fields
        if (!saleDate || !items || !storeLocation || !customer || !('age' in customer) || !customer.gender || !customer.email || !('satisfaction' in customer) || !couponUsed || !purchaseMethod) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        // parse fields
        const age = parseInt(customer.age);
        const satisfaction = parseInt(customer.satisfaction);

        const updateFields = {
            saleDate,
            items,
            storeLocation,
            customer: {
                ...customer,
                age,
                satisfaction
            },
            couponUsed,
            purchaseMethod
        };

        const result = await Sale.updateOne({ _id: req.params.id }, { $set: updateFields });
        if (result.modifiedCount === 1) {
            return res.status(200).json({ message: 'Sales updated successfully' });
        }
        else if (result.matchedCount===1 && result.modifiedCount === 0) {
            return res.status(200).json({ message: 'Sales could not be updated. Nothing has changed.' });
        } else {
            return res.status(404).json({ message: 'Sales not found' });
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal server error' })
    }
})


/*
@type     -   DELETE
@route    -   /api/sales/:id
@desc     -   It will delete a specific "sale" document from the collection and return a success / fail message to the client
@access   -   PROTECTED
*/
router.delete('/sales/:id', async (req, res) => {
    try {
        const result = await Sale.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Sale not found' });
        }
        res.status(200).json({ message: 'Sale deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



module.exports = router