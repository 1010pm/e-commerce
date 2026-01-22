/**
 * Home Page - Production Ready
 * Premium home page with smooth animations and engaging UX
 */

import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/slices/productsSlice';
import ProductCard from '../components/features/ProductCard';
import { ProductCardSkeleton } from '../components/common/Loading';
import { ROUTES } from '../constants/routes';
import Button from '../components/common/Button';
import { APP_CONFIG } from '../constants/config';
import { createScrollAnimation, staggerAnimation } from '../utils/animations';

const Home = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);
  const heroRef = useRef(null);
  const categoriesRef = useRef(null);
  const productsRef = useRef(null);

  useEffect(() => {
    // Fetch featured products
    dispatch(fetchProducts({ filters: {}, pagination: { limit: 8 } }));
  }, [dispatch]);

  // Scroll animations
  useEffect(() => {
    const animateOnScroll = createScrollAnimation((element) => {
      element.classList.add('animate-fade-in-up');
    });

    const cleanupFunctions = [];

    if (categoriesRef.current) {
      const cleanup = animateOnScroll(categoriesRef.current);
      if (cleanup) cleanupFunctions.push(cleanup);
    }
    if (productsRef.current) {
      const cleanup = animateOnScroll(productsRef.current);
      if (cleanup) cleanupFunctions.push(cleanup);
    }

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup && cleanup());
    };
  }, [products]);

  const featuredProducts = products.slice(0, 8);
  const categories = [
    { id: 1, name: 'Electronics', image: '/category-electronics.jpg', icon: '📱' },
    { id: 2, name: 'Clothing', image: '/category-clothing.jpg', icon: '👕' },
    { id: 3, name: 'Home & Kitchen', image: '/category-home.jpg', icon: '🏠' },
    { id: 4, name: 'Books', image: '/category-books.jpg', icon: '📚' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-24 md:py-32 overflow-hidden"
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
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 animate-fade-in-up">
              Welcome to <span className="text-primary-200 animate-pulse-slow">E-Store</span>
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-primary-100 leading-relaxed animate-fade-in-up stagger-1">
              Discover amazing products at unbeatable prices. Shop now and experience the best online shopping.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-2">
              <Link to={ROUTES.PRODUCTS} className="group">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 press-effect group-hover:shadow-primary-500/50"
                >
                  Shop Now
                </Button>
              </Link>
              <Link to={ROUTES.PRODUCTS} className="group">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-white hover:bg-white hover:text-primary-600 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 press-effect"
                >
                  Browse Products
                </Button>
              </Link>
            </div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                to={`${ROUTES.PRODUCTS}?category=${encodeURIComponent(category.name)}`}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover-lift animate-fade-in-up"
                style={staggerAnimation(index, 100)}
              >
                <div className="aspect-square bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex flex-col items-center justify-center relative overflow-hidden">
                  {/* Icon */}
                  <div className="text-6xl mb-3 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                    {category.icon}
                  </div>
                  <span className="text-white text-lg font-bold group-hover:scale-110 transition-transform duration-300 relative z-10">
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
              <Button variant="outline" className="hover-lift press-effect">
                View All →
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
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
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
              <div className="text-center mt-12 animate-fade-in-up">
                <Link to={ROUTES.PRODUCTS}>
                  <Button 
                    size="lg" 
                    className="hover-glow press-effect shadow-lg hover:shadow-xl"
                  >
                    View All Products →
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

      {/* Offers Section */}
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
            <p className="text-xl md:text-2xl mb-10 text-primary-100 leading-relaxed">
              Free shipping on orders over{' '}
              <span className="font-bold text-white">
                {APP_CONFIG.CURRENCY_SYMBOL}
                {APP_CONFIG.FREE_SHIPPING_THRESHOLD}
              </span>
            </p>
            <Link to={ROUTES.PRODUCTS} className="inline-block">
              <Button 
                size="lg" 
                variant="secondary" 
                className="shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 press-effect hover:shadow-white/20"
              >
                Shop Now →
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

