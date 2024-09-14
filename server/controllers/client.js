import Product from '../models/Product.js';
import ProductStat from '../models/ProductStat.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import getCountryIso3 from 'country-iso-2-to-3';
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    // we are going to make api call to the database with every single product for productstat
    const productsWithStats = await Promise.all(
      products.map(async (product) => {
        const stat = await ProductStat.find({
          productId: product._id,
        });
        return {
          // for mongodb syntax incase of promise
          ...product._doc,
          stat,
        };
      })
      // in real this query is slow so
      // mongodb has concept of aggregate function
      // similar to sql joins and unions
      // basically allow you to combine 2 databses
    );
    res.status(200).json(productsWithStats);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const customers = await User.find({
      role: 'user',
    }).select('-password');
    res.status(200).json(customers);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// tricky cuz we are going to do serverside pagination
export const getTransactions = async (req, res) => {
  try {
    // this is what we are getting back from material ui
    // sort should lool like this:{"field":"userId","sort":"desc"}
    const { page = 1, pageSize = 20, sort = null, search = '' } = req.query;
    // this is what mongodb will able to read
    // formated sort should look like {userId: -1}
    const generateSort = () => {
      // string into object
      const sortParsed = JSON.parse(sort);
      const sortFormatted = {
        [sortParsed.field]: (sortParsed.sort = 'asc' ? 1 : -1),
      };
      return sortFormatted;
    };

    const sortFormatted = Boolean(sort) ? generateSort() : {};

    const transactions = await Transaction.find({
      // search cost field
      // or allow us to search multiple field
      $or: [{ cost: { $regex: new RegExp(search, 'i') } }],
      $or: [{ userId: { $regex: new RegExp(search, 'i') } }],
    })
      .sort(sortFormatted)
      .skip(page * pageSize)
      .limit(pageSize);

    // for total amount of docs that exist in mongodb
    const total = await Transaction.countDocuments({
      name: { $regex: search, $options: 'i' },
    });

    res.status(200).json({
      transactions,
      total,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getGeography = async (req, res) => {
  try {
    const users = await User.find();

    const mappedLocations = users.reduce((acc, { country }) => {
      const countryISO3 = getCountryIso3(country);
      if (!acc[countryISO3]) {
        acc[countryISO3] = 0;
      }
      acc[countryISO3]++;
      return acc;
    }, {});

    const formattedLocations = Object.entries(mappedLocations).map(
      ([country, count]) => {
        return { id: country, value: count };
      }
    );

    res.status(200).json(formattedLocations);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
