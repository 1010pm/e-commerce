/**
 * Home Page - Premium Landing Page
 * Enhanced design with comprehensive sections, trust indicators, and optimized performance
 */

import React, { useEffect, useRef, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/slices/productsSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import ProductCard from '../components/features/ProductCard';
import { ProductCardSkeleton } from '../components/common/Loading';
import { ROUTES } from '../constants/routes';
import Button from '../components/common/Button';
import { APP_CONFIG } from '../constants/config';
import { createScrollAnimation, staggerAnimation } from '../utils/animations';

// Icons from Heroicons
import {
  ShieldCheckIcon,
  TruckIcon,
  SparklesIcon,
  StarIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const Home = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);
  const { categories, loading: categoriesLoading } = useSelector((state) => state.categories);
  const heroRef = useRef(null);
  const categoriesRef = useRef(null);
  const productsRef = useRef(null);
  const featuresRef = useRef(null);
  const newsletterRef = useRef(null);

  useEffect(() => {
    // Fetch featured products and categories
    console.log('🏠 [HOME] Fetching products and categories...');
    dispatch(fetchProducts({ filters: {}, pagination: { limit: 12 } }));
    dispatch(fetchCategories(false)); // false = public view (active only)
  }, [dispatch]);

  // Scroll animations
  useEffect(() => {
    const animateOnScroll = createScrollAnimation((element) => {
      element.classList.add('animate-fade-in-up');
    });

    const cleanupFunctions = [];
    const refs = [categoriesRef, productsRef, featuresRef, newsletterRef];

    refs.forEach((ref) => {
      if (ref.current) {
        const cleanup = animateOnScroll(ref.current);
        if (cleanup) cleanupFunctions.push(cleanup);
      }
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup && cleanup());
    };
  }, [products]);

  const featuredProducts = products.slice(0, 12);
  
  // Debug logging
  useEffect(() => {
    console.log('🏠 [HOME] Products state updated:', {
      totalProducts: products.length,
      featuredProducts: featuredProducts.length,
      loading,
      productNames: products.slice(0, 3).map(p => p.name),
    });
  }, [products, loading, featuredProducts]);
  
  // Cache category icons
  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'Electronics': '📱',
      'Clothing': '👕',
      'Home & Kitchen': '🏠',
      'Books': '📚',
      'Sports': '⚽',
      'Toys': '🧸',
      'Beauty': '💄',
      'Food': '🍔',
    };
    return iconMap[categoryName] || '📦';
  };

  // Trust indicators
  const trustIndicators = [
    {
      icon: <ShieldCheckIcon className="w-8 h-8" />,
      title: '100% Secure',
      description: 'Your transactions are completely secure and encrypted',
    },
    {
      icon: <TruckIcon className="w-8 h-8" />,
      title: 'Fast Shipping',
      description: 'Free shipping on orders over OMR ' + APP_CONFIG.FREE_SHIPPING_THRESHOLD,
    },
    {
      icon: <SparklesIcon className="w-8 h-8" />,
      title: 'Quality Guaranteed',
      description: 'Premium products from trusted brands',
    },
    {
      icon: <StarIcon className="w-8 h-8" />,
      title: '24/7 Support',
      description: 'Our customer service team is always here to help',
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section - Premium Design */}
      <section 
        ref={heroRef}
        className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20 md:py-32 overflow-hidden"
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0 animate-pulse-slow" 
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}
          ></div>
        </div>

        {/* Floating Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-secondary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 animate-fade-in-up leading-tight">
              Welcome to <span className="text-primary-200 animate-pulse-slow">E-Store</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-8 text-primary-100 leading-relaxed animate-fade-in-up stagger-1 max-w-2xl mx-auto">
              Discover amazing products at unbeatable prices. Shop now and experience the best online shopping.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-2 flex-wrap">
              <Link to={ROUTES.PRODUCTS} className="group">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 press-effect group-hover:shadow-primary-500/50 flex items-center gap-2 whitespace-nowrap"
                >
                  <SparklesIcon className="w-5 h-5" />
                  Shop Now
                </Button>
              </Link>
              <Link to={ROUTES.PRODUCTS} className="group">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-black hover:bg-white 
                  hover:text-primary-600 shadow-xl hover:shadow-2xl 
                  hover:scale-105 transition-all duration-300 press-effect flex items-center gap-2 whitespace-nowrap"
                >
                  Browse Products
                  <ArrowRightIcon className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="py-12 md:py-16 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustIndicators.map((indicator, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                style={staggerAnimation(index, 100)}
              >
                <div className="text-primary-600 mb-3 transform hover:scale-110 transition-transform duration-300">
                  {indicator.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{indicator.title}</h3>
                <p className="text-sm text-gray-600">{indicator.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section ref={categoriesRef} className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 gradient-text">
              Shop by Category
            </h2>
            <p className="text-gray-600 text-lg">Browse our wide selection of products</p>
          </div>
          {categoriesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="aspect-square bg-gray-200 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {categories.slice(0, 8).map((category, index) => (
                <Link
                  key={category.id}
                  to={`${ROUTES.PRODUCTS}?category=${encodeURIComponent(category.slug || category.name)}`}
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover-lift animate-fade-in-up"
                  style={staggerAnimation(index, 100)}
                >
                  <div className="aspect-square bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Image with proper loading */}
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : null}
                    {!category.imageUrl && (
                      <div className="text-6xl mb-3 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                        {getCategoryIcon(category.name)}
                      </div>
                    )}
                    <span className="text-white text-lg font-bold group-hover:scale-110 transition-transform duration-300 relative z-10 drop-shadow-lg">
                      {category.name}
                    </span>
                  
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Bottom Border Animation */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    
                    {/* Shine Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No categories available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section ref={productsRef} className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 animate-fade-in-up">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 gradient-text">
                Featured Products
              </h2>
              <p className="text-gray-600 text-lg">Handpicked products just for you</p>
            </div>
            <Link to={ROUTES.PRODUCTS}>
              <Button variant="outline" className="hover-lift press-effect flex items-center gap-2">
                View All
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(12)].map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-fade-in-up"
                    style={staggerAnimation(index, 50)}
                  >
                    <Suspense fallback={<ProductCardSkeleton />}>
                      <ProductCard product={product} />
                    </Suspense>
                  </div>
                ))}
              </div>
              <div className="text-center mt-12 animate-fade-in-up">
                <Link to={ROUTES.PRODUCTS}>
                  <Button 
                    size="lg" 
                    className="hover-glow press-effect shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
                  >
                    View All Products
                    <ArrowRightIcon className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16 animate-fade-in-up">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500 text-lg">No products available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
              Why Choose Us?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              We're committed to providing the best shopping experience with quality products and excellent service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🛒',
                title: 'Wide Selection',
                description: 'Browse through thousands of products across multiple categories',
              },
              {
                icon: '💰',
                title: 'Best Prices',
                description: 'Competitive pricing and regular discounts on your favorite items',
              },
              {
                icon: '⚡',
                title: 'Fast Checkout',
                description: 'Quick and easy checkout process with multiple payment options',
              },
              {
                icon: '🔒',
                title: 'Secure Payment',
                description: 'Your payment information is always encrypted and secure',
              },
              {
                icon: '📦',
                title: 'Easy Returns',
                description: '30-day return policy for hassle-free shopping experience',
              },
              {
                icon: '📞',
                title: 'Expert Support',
                description: 'Friendly customer support team ready to help anytime',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift animate-fade-in-up"
                style={staggerAnimation(index, 100)}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0 animate-pulse-slow" 
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}
          ></div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1.5s' }}></div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto animate-fade-in-up">
            <div className="inline-block mb-4">
              <span className="text-6xl animate-bounce-subtle inline-block">🎉</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4">
              Special Offers
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 leading-relaxed">
              Free shipping on orders over{' '}
              <span className="font-bold text-white">
                {APP_CONFIG.CURRENCY_SYMBOL}
                {APP_CONFIG.FREE_SHIPPING_THRESHOLD}
              </span>
            </p>
            <p className="text-lg text-primary-100 mb-10">
              Limited time offer - Shop today and save up to 30% on selected items!
            </p>
            <Link to={ROUTES.PRODUCTS} className="inline-block">
              <Button 
                size="lg" 
                variant="secondary" 
                className="shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 press-effect hover:shadow-white/20 flex items-center gap-2"
              >
                Shop the Deal
                <ArrowRightIcon className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section ref={newsletterRef} className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Stay Updated
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Subscribe to our newsletter for exclusive deals, new arrivals, and shopping tips
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
              />
              <Button
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Subscribe
                <CheckCircleIcon className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

