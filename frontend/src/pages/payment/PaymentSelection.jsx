import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import EsewaForm from '../../components/payment/EsewaForm';
import { toast } from 'react-hot-toast';

const PaymentSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { campaign, initialAmount, initialPaymentMethod, selectedRewardId } = location.state || {};
  
  const [amount, setAmount] = useState(initialAmount || '');
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod || 'esewa');
  const [loading, setLoading] = useState(false);
  const [esewaConfig, setEsewaConfig] = useState(null);

  if (!campaign) {
    return <div className="p-8 text-center">Campaign information missing. Please return to the campaign page.</div>;
  }

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!amount || amount < 10) {
      toast.error('Minimum donation is NPR 10');
      return;
    }

    setLoading(true);
    try {
      const response = await paymentService.initiatePayment({
        campaignId: campaign._id,
        amount: parseInt(amount),
        paymentMethod,
        ...(selectedRewardId && { rewardTierId: selectedRewardId })
      });

      if (paymentMethod === 'esewa') {
        setEsewaConfig(response); // Triggers EsewaForm rendering
      } else if (paymentMethod === 'khalti') {
        window.location.href = response.paymentUrl;
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Payment processing failed');
      setLoading(false);
    }
  };

  if (esewaConfig) {
    return <EsewaForm formData={esewaConfig.formData} formUrl={esewaConfig.formUrl} />;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Back this Project</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-2">{campaign.title}</h2>
        <p className="text-gray-600 mb-4">{campaign.shortDescription}</p>
      </div>

      <form onSubmit={handlePayment} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pledge Amount (NPR)
          </label>
          <input
            type="number"
            min="10"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
            placeholder="Enter amount (Min 10)"
            required
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4">Payment Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className={`border p-4 rounded-lg cursor-pointer flex items-center justify-between ${paymentMethod === 'esewa' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-gray-200'}`}
              onClick={() => setPaymentMethod('esewa')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">eSewa</div>
                <span className="font-medium">eSewa</span>
              </div>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="esewa" 
                checked={paymentMethod === 'esewa'}
                onChange={() => setPaymentMethod('esewa')}
                className="text-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div 
              className={`border p-4 rounded-lg cursor-pointer flex items-center justify-between ${paymentMethod === 'khalti' ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' : 'border-gray-200'}`}
              onClick={() => setPaymentMethod('khalti')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">Khalti</div>
                <span className="font-medium">Khalti</span>
              </div>
              <input 
                type="radio" 
                name="paymentMethod" 
                value="khalti" 
                checked={paymentMethod === 'khalti'}
                onChange={() => setPaymentMethod('khalti')}
                className="text-purple-600 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {loading ? 'Processing...' : `Pay NPR ${amount || '0'}`}
        </button>
      </form>
    </div>
  );
};

export default PaymentSelection;
