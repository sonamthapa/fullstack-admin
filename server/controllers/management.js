import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

export const getAdmins = async (req, res) => {
  try {
    // all the admin remove password
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.status(200).json(admins);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getUserPerformance = async (req, res) => {
  try {
    const { id } = req.params;

    // aggregation pipeline allows you to reference one database
    // and use that reference talk to another database
    // 1st thing match our id with new mongoose types id

    // here
    // we are grabing userid from param and converting it into right format
    // in mongobd
    // and we are matching it and findind the user of that id in user modal
    // basically we are combining these 2 table into one
    // similar to sql joint
    const userWithStats = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        // now we want to look up to affiliatestats
        // we can grab info from affiliatestats
        $lookup: {
          from: 'affiliatestats',
          localField: '_id', // id of our current id
          foreignField: 'userId', // userid in affiliate table
          as: 'affiliateStats',
        },
      },
      //   flatten an array
      { $unwind: '$affiliateStats' },
    ]);

    const saleTransactions = await Promise.all(
      userWithStats[0].affiliateStats.affiliateSales.map((id) => {
        return Transaction.findById(id);
      })
    );
    const filteredSaleTransactions = saleTransactions.filter(
      (transaction) => transaction !== null
    );

    res
      .status(200)
      .json({ user: userWithStats[0], sales: filteredSaleTransactions });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
