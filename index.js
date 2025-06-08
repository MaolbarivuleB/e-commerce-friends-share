// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();

const authenticateToken = require('./middleware');

const middleware = require('./middleware');

app.use(express.json());



const PORT = process.env.PORT || 3000;

// MongoDB Atlas URI
const MONGO_URI = "mongodb+srv://Maolbarivule:Maolbarivule@cluster0.zumvy4z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"


// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    })

    
     
    
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);


        
    });



// API to get all products
app.get('/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products.' });
    }
});

// API to get a single product by ID
app.get('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product.' });
    }
});

// API to create an order
app.post('/orders', async (req, res) => {
    try {
        const { items } = req.body;

        let totalAmount = 0;
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ error: `Product with ID ${item.product} not found.` });
            }

            if (item.quantity > product.stock) {
                return res.status(400).json({
                    error: `Not enough stock for product ${product.name}. Available: ${product.stock}`
                });
            }

            totalAmount += product.price * item.quantity;
        }

        const newOrder = new Order({
            items,
            totalAmount
        });

        // Reduce stock for ordered products
        for (const item of items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
            });
        }

        await newOrder.save();

        res.status(201).json({
            message: 'Order placed successfully.',
            order: newOrder
        });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'Failed to place order.' });
    }
});


// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.status(201).send('User registered');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).send('Invalid credentials');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).send('Invalid credentials');

    const token = jwt.sign({ _id: user._id }, 'secretKey');
    res.header('Authorization', token).send({ token });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Add Product (Admin only for simplicity)
app.post('/products', async (req, res) => {
  const { name, price, stock } = req.body;

  try {
    const product = new Product({ name, price, stock });
    await product.save();

    res.status(201).send('Product added');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Get Product Catalog
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).send(products);
  } catch (err) {
    res.status(400).send(err.message);
  }
});
// Place Order


app.post('/orders', authenticateToken, async (req, res) => {
  const { products } = req.body; 
  
  
  
  // [{ productId, quantity }]

  try {
    const productUpdates = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product || product.stock < item.quantity) {
        return res.status(400).send(`Insufficient stock for product: ${item.productId}`);
      }
      productUpdates.push({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { stock: -item.quantity } },
        },
      });
    }

    // Update stock in bulk
    await Product.bulkWrite(productUpdates);

    const order = new Order({
      userId: req.user._id,
      products,
    });
    await order.save();

    res.status(201).send('Order placed');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Get Past Orders
app.get('/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).populate('products.productId');
    res.status(200).send(orders);
  } catch (err) {
    res.status(400).send(err.message);
  }
});















