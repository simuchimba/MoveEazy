import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Users, Shield } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-orange-700">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-4">MovEazy</h1>
          <p className="text-xl text-white/90">Your Reliable Ride Booking Solution</p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* User Card */}
          <div className="card hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Users className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Rider</h2>
              <p className="text-gray-600 mb-6">
                Book rides quickly and safely to your destination
              </p>
              <div className="space-y-3 w-full">
                <Link to="/user/login" className="block">
                  <button className="btn-primary w-full">Login</button>
                </Link>
                <Link to="/user/register" className="block">
                  <button className="btn-secondary w-full">Sign Up</button>
                </Link>
              </div>
            </div>
          </div>

          {/* Driver Card */}
          <div className="card hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Car className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Driver</h2>
              <p className="text-gray-600 mb-6">
                Earn money by providing rides to passengers
              </p>
              <div className="space-y-3 w-full">
                <Link to="/driver/login" className="block">
                  <button className="btn-primary w-full">Login</button>
                </Link>
                <Link to="/driver/register" className="block">
                  <button className="btn-secondary w-full">Register</button>
                </Link>
              </div>
            </div>
          </div>

          {/* Admin Card */}
          <div className="card hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Shield className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Admin</h2>
              <p className="text-gray-600 mb-6">
                Manage platform operations and analytics
              </p>
              <div className="space-y-3 w-full">
                <Link to="/admin/login" className="block">
                  <button className="btn-primary w-full">Admin Login</button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 text-center text-white">
          <h3 className="text-2xl font-bold mb-8">Why Choose Yango?</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div>
              <h4 className="font-semibold mb-2">Safe & Secure</h4>
              <p className="text-white/80">Verified drivers and secure payments</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Affordable Prices</h4>
              <p className="text-white/80">Competitive rates in Kwacha</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">24/7 Availability</h4>
              <p className="text-white/80">Get rides anytime, anywhere</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
