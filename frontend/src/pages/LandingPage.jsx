// Force Vite HMR Rebuild
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getValidImageUrl, handleImageError } from '../utils/imageUtils';
import aiHeroGraphic from '../assets/ai-hero-graphic.png';
import {
  Step1Illustration,
  Step2Illustration,
  Step3Illustration,
  Step4Illustration,
  ShieldCheckIcon,
  SupportIcon,
  WalletIcon,
  MedalIcon,
  ChevronRightIcon
} from '../components/HowItWorksStepIllustrations';
import FeatureCards from '../components/FeatureCards';
import AIFinderModal from '../components/AIFinderModal';
import AIChatbot from '../components/AIChatbot';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAiChatbotOpen, setIsAiChatbotOpen] = useState(false);
  // Search Filter States
  const [searchLocation, setSearchLocation] = useState('gundalapatti');
  const [dropoffLocation, setDropoffLocation] = useState('Dharmapuri');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [liveSuggestions, setLiveSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!searchLocation || searchLocation.trim().length < 2) {
      if (active) setLiveSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchLocation)}&lat=11.1271&lon=78.6569&limit=40`);
        const data = await res.json();
        if (active) {
          if (data && data.features && data.features.length > 0) {
            let suggestions = data.features
              .filter(f => f.properties && (f.properties.country === 'India' || f.properties.countrycode === 'IN' || f.properties.countrycode === 'in'))
              .map(f => {
                const p = f.properties;
                const osmVal = p.osm_value || '';
                
                let weight = 5;
                if (['city', 'town'].includes(osmVal)) weight = 1;
                else if (['county', 'state_district'].includes(osmVal)) weight = 2;
                else if (['suburb', 'neighbourhood', 'residential', 'commercial'].includes(osmVal)) weight = 3;
                else if (['village', 'hamlet'].includes(osmVal)) weight = 4;

                return {
                  lat: f.geometry.coordinates[1],
                  lon: f.geometry.coordinates[0],
                  name: p.name || '',
                  city: p.city || '',
                  state: p.state || '',
                  country: p.country || '',
                  weight
                };
              });

            // Sort: 1. Tamil Nadu first, 2. by weight (City > District > Area > Village)
            suggestions.sort((a, b) => {
              const aIsTN = a.state === 'Tamil Nadu' ? 0 : 1;
              const bIsTN = b.state === 'Tamil Nadu' ? 0 : 1;
              if (aIsTN !== bIsTN) return aIsTN - bIsTN;
              return a.weight - b.weight;
            });

            // Take top 10 after sorting
            setLiveSuggestions(suggestions.slice(0, 10));
          } else {
            setLiveSuggestions([]);
          }
        }
      } catch (err) {
        if (active) setLiveSuggestions([]);
      } finally {
        if (active) setSearchLoading(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchLocation]);

  const [showDropoffDropdown, setShowDropoffDropdown] = useState(false);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [dropoffLoading, setDropoffLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!dropoffLocation || dropoffLocation.trim().length < 2) {
      if (active) setDropoffSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setDropoffLoading(true);
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(dropoffLocation)}&lat=11.1271&lon=78.6569&limit=40`);
        const data = await res.json();
        if (active) {
          if (data && data.features && data.features.length > 0) {
            let suggestions = data.features
              .filter(f => f.properties && (f.properties.country === 'India' || f.properties.countrycode === 'IN' || f.properties.countrycode === 'in'))
              .map(f => {
                const p = f.properties;
                const osmVal = p.osm_value || '';
                
                let weight = 5;
                if (['city', 'town'].includes(osmVal)) weight = 1;
                else if (['county', 'state_district'].includes(osmVal)) weight = 2;
                else if (['suburb', 'neighbourhood', 'residential', 'commercial'].includes(osmVal)) weight = 3;
                else if (['village', 'hamlet'].includes(osmVal)) weight = 4;

                return {
                  lat: f.geometry.coordinates[1],
                  lon: f.geometry.coordinates[0],
                  name: p.name || '',
                  city: p.city || '',
                  state: p.state || '',
                  country: p.country || '',
                  weight
                };
              });

            suggestions.sort((a, b) => {
              const aIsTN = a.state === 'Tamil Nadu' ? 0 : 1;
              const bIsTN = b.state === 'Tamil Nadu' ? 0 : 1;
              if (aIsTN !== bIsTN) return aIsTN - bIsTN;
              return a.weight - b.weight;
            });

            setDropoffSuggestions(suggestions.slice(0, 10));
          } else {
            setDropoffSuggestions([]);
          }
        }
      } catch (err) {
        if (active) setDropoffSuggestions([]);
      } finally {
        if (active) setDropoffLoading(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [dropoffLocation]);

  const [searchCategory, setSearchCategory] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchMode, setSearchMode] = useState('self'); // 'self' | 'driver'
  const [showAiModal, setShowAiModal] = useState(false);

  // Multi-Role Registration Modal States
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    return !sessionStorage.getItem('royal_welcome_shown');
  });
  const [showMultiRoleRegModal, setShowMultiRoleRegModal] = useState(false);
  const [selectedRegRole, setSelectedRegRole] = useState(null); // 'car_owner' | 'driver' | 'company'
  const [regSuccessNotice, setRegSuccessNotice] = useState('');
  const [ownerDocError, setOwnerDocError] = useState('');
  const [driverDocError, setDriverDocError] = useState('');
  const [companyDocError, setCompanyDocError] = useState('');

  // Car Owner Form State
  const [ownerFormData, setOwnerFormData] = useState({
    name: '', phone: '', email: '', password: '', aadhaar: '', carName: '', plate: '', pricePerDay: 2000,
    insuranceFileName: '', rcFileName: '', aadhaarFileName: ''
  });

  // Driver Form State
  const [driverFormData, setDriverFormData] = useState({
    name: '', phone: '', email: '', password: '', licenceNo: 'TN-29-2024-0099', experience: '5 Years', location: 'Dharmapuri',
    licenceFileName: '', faceFileName: '', aadhaarFileName: ''
  });

  // Business Company Form State
  const [companyStep, setCompanyStep] = useState(1);
  const [companyFormData, setCompanyFormData] = useState({
    ownerName: '', companyName: '', email: '', phone: '', logoUrl: '', logoFileName: '', gstNo: '33AAAAA0000A1Z5', address: '', password: '', plan: '14-Day Free Trial (₹0 upfront)'
  });

  const HIERARCHICAL_LOCATIONS = [
    { state: 'Tamil Nadu', district: 'Dharmapuri', taluka: 'Dharmapuri', village: 'Gundalapatti Bypass Hub', label: 'gundalapatti, Dharmapuri, Tamil Nadu, India' },
    { state: 'Tamil Nadu', district: 'Dharmapuri', taluka: 'Dharmapuri', village: 'Thoppur Ghat Section', label: 'thoppur, Dharmapuri, Tamil Nadu, India' },
    { state: 'Tamil Nadu', district: 'Salem', taluka: 'Mettur', village: 'Mettur Bus Stand / Dam', label: 'mettur, Salem, Tamil Nadu, India' },
    { state: 'Tamil Nadu', district: 'Dharmapuri', taluka: 'Dharmapuri', village: 'Dharmapuri Town Center', label: 'Dharmapuri, Tamil Nadu, India' },
    { state: 'Tamil Nadu', district: 'Dharmapuri', taluka: 'Dharmapuri', village: 'Pidamaneri Area', label: 'Pidamaneri, Dharmapuri, Tamil Nadu' },
    { state: 'Tamil Nadu', district: 'Dharmapuri', taluka: 'Dharmapuri', village: 'Dharmapuri Bus Stand', label: 'Dharmapuri Bus Stand, Dharmapuri, Tamil Nadu' },
    { state: 'Tamil Nadu', district: 'Dharmapuri', taluka: 'Dharmapuri', village: 'Dharmapuri Railway Station', label: 'Dharmapuri Railway Station, Dharmapuri' },
    { state: 'Tamil Nadu', district: 'Dharmapuri', taluka: 'Pennagaram', village: 'Hogenakkal Falls Entry', label: 'Hogenakkal Falls Entry, Pennagaram, Dharmapuri' },
    { state: 'Tamil Nadu', district: 'Salem', taluka: 'Salem', village: 'Salem Junction', label: 'Salem, Tamil Nadu, India' },
    { state: 'Tamil Nadu', district: 'Krishnagiri', taluka: 'Krishnagiri', village: 'Krishnagiri Main Hub', label: 'Krishnagiri, Tamil Nadu, India' },
    { state: 'Tamil Nadu', district: 'Krishnagiri', taluka: 'Hosur', village: 'Hosur IT Park Road', label: 'Hosur Industrial Hub, Hosur, Krishnagiri' },
    { state: 'Tamil Nadu', district: 'Chennai', taluka: 'Guindy', village: 'Kathipara Junction Hub', label: 'Kathipara Junction, Guindy, Chennai, Tamil Nadu' },
    { state: 'Tamil Nadu', district: 'Coimbatore', taluka: 'Mettupalayam', village: 'Sirumugai Village', label: 'Sirumugai Village, Coimbatore, Tamil Nadu' },
    { state: 'Maharashtra', district: 'Mumbai Suburban', taluka: 'Andheri', village: 'Juhu Scheme', label: 'Juhu Scheme, Andheri, Mumbai, Maharashtra' },
    { state: 'Karnataka', district: 'Bangalore Urban', taluka: 'Bangalore East', village: 'Whitefield Zone', label: 'Whitefield Zone, Bangalore, Karnataka' },
    { state: 'Delhi NCR', district: 'South Delhi', taluka: 'Hauz Khas', village: 'Green Park', label: 'Green Park, Hauz Khas, Delhi NCR' }
  ];

  const getDynamicLocationSuggestions = (query) => {
    if (!query || query.trim().length === 0) return HIERARCHICAL_LOCATIONS.map(i => i.label);
    const q = query.trim().toLowerCase();
    return HIERARCHICAL_LOCATIONS.filter(item => item.label.toLowerCase().includes(q)).map(item => item.label);
  };

  // Leaflet Map & Geocoding States
  const [leafletMap, setLeafletMap] = useState(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Hero Background Carousel Images (5 Project Related Cars)
  const HERO_IMAGES = [
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=2000',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=2000',
    'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=2000',
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=2000',
    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=2000'
  ];
  const [heroBgIndex, setHeroBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroBgIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 2500);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      clearInterval(interval);
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // AI Recommendation & Search States
  const [aiBudget, setAiBudget] = useState(3000);
  const [aiPassengers, setAiPassengers] = useState(5);
  const [aiTripDays, setAiTripDays] = useState(3);
  const [aiLuggage, setAiLuggage] = useState('Medium');
  const [aiTripType, setAiTripType] = useState('Family');
  const [aiType, setAiType] = useState('SUV');
  const [aiNeedDriver, setAiNeedDriver] = useState('No');
  const [aiResultCard, setAiResultCard] = useState(null);
  const [aiSearchPrompt, setAiSearchPrompt] = useState('');
  const [openFaqIdx, setOpenFaqIdx] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // AI Car Comparison States
  const [compareCarA, setCompareCarA] = useState('Hyundai Creta');
  const [compareCarB, setCompareCarB] = useState('Kia Seltos');
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // AI Smart Pricing State
  const [aiPricingEnabled, setAiPricingEnabled] = useState(true);

  // AI Trip Suggestion States
  const [aiTripDestination, setAiTripDestination] = useState('Ooty');
  const [aiTripDaysInput, setAiTripDaysInput] = useState(3);
  const [aiTripResult, setAiTripResult] = useState(null);
  const [aiTripLoading, setAiTripLoading] = useState(false);

  const AI_CAR_DB = {
    'Hyundai Creta': { comfort: 5, mileage: 4, luggage: 5, safety: 5, price: 1800, seats: 5, fuel: 'Petrol/Diesel', type: 'SUV', img: 'https://images.unsplash.com/photo-1612544448445-b8232cff3b6c?auto=format&fit=crop&w=400' },
    'Kia Seltos': { comfort: 4, mileage: 5, luggage: 4, safety: 5, price: 2000, seats: 5, fuel: 'Petrol/Diesel', type: 'SUV', img: 'https://images.unsplash.com/photo-1597007066704-67bf2068d5b2?auto=format&fit=crop&w=400' },
    'Toyota Innova': { comfort: 5, mileage: 3, luggage: 5, safety: 5, price: 2500, seats: 7, fuel: 'Diesel', type: 'MUV', img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400' },
    'Honda City': { comfort: 5, mileage: 5, luggage: 3, safety: 4, price: 1600, seats: 5, fuel: 'Petrol', type: 'Sedan', img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400' },
    'Maruti Swift': { comfort: 3, mileage: 5, luggage: 2, safety: 3, price: 900, seats: 5, fuel: 'Petrol', type: 'Hatchback', img: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=400' },
    'Mahindra Thar': { comfort: 3, mileage: 3, luggage: 3, safety: 4, price: 3000, seats: 4, fuel: 'Diesel', type: 'Off-Road', img: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=400' },
    'Mercedes E-Class': { comfort: 5, mileage: 3, luggage: 4, safety: 5, price: 5000, seats: 5, fuel: 'Petrol', type: 'Luxury', img: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=400' },
    'Tata Nexon EV': { comfort: 4, mileage: 5, luggage: 4, safety: 5, price: 2200, seats: 5, fuel: 'Electric', type: 'EV SUV', img: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=400' },
  };

  const handleRunAiRecommendation = () => {
    setAiLoading(true);
    setTimeout(() => {
      // Weighted scoring: Budget 30% + Passengers 25% + Type 20% + Trip 15% + Rating 10%
      let best = null; let bestScore = -1;
      const CAR_POOL = [
        { car: 'Toyota Innova Crysta', price: 2500, seats: 7, type: 'SUV', rating: 4.9, img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400', reasons: ['Fits 7 passengers', 'Best for long trips', 'High customer rating', 'Spacious boot'] },
        { car: 'Hyundai Creta SX', price: 1800, seats: 5, type: 'SUV', rating: 4.8, img: 'https://images.unsplash.com/photo-1612544448445-b8232cff3b6c?auto=format&fit=crop&w=400', reasons: ['Perfect city SUV', 'Great mileage', 'Within budget', 'Easy parking'] },
        { car: 'Honda City ZX', price: 1600, seats: 5, type: 'Sedan', rating: 4.7, img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400', reasons: ['Comfortable sedan', 'Highway cruiser', 'AC & sunroof', 'Best mileage'] },
        { car: 'Mercedes-Benz E-Class', price: 5000, seats: 5, type: 'Luxury', rating: 5.0, img: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=400', reasons: ['Premium experience', 'Business trips', 'Chauffeur available', 'Prestige vehicle'] },
        { car: 'Mahindra XUV700', price: 2800, seats: 7, type: 'SUV', rating: 4.8, img: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=400', reasons: ['Best for hill stations', 'All-wheel drive', '7 seats + ADAS safety', 'Panoramic sunroof'] },
        { car: 'Tata Nexon EV', price: 2200, seats: 5, type: 'Electric', rating: 4.8, img: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=400', reasons: ['Zero emission', 'Low running cost', 'City perfect', 'Auto transmission'] },
      ];
      for (const c of CAR_POOL) {
        const budgetScore = c.price <= aiBudget ? 30 : Math.max(0, 30 - (c.price - aiBudget) / 100);
        const passengerScore = c.seats >= aiPassengers ? 25 : 0;
        const typeScore = c.type.toLowerCase().includes(aiType.toLowerCase()) ? 20 : (aiType === 'Any' ? 10 : 0);
        const tripScore = (aiTripType === 'Hill Station' && c.type.includes('SUV')) ? 15 : (aiTripType === 'Business' && c.type === 'Luxury') ? 15 : (aiTripType === 'Family' && c.seats >= 6) ? 15 : 8;
        const ratingScore = (c.rating - 4) * 100;
        const total = budgetScore + passengerScore + typeScore + tripScore + ratingScore;
        if (total > bestScore) { bestScore = total; best = c; }
      }
      const matchPct = Math.min(99, Math.round(60 + (bestScore / 100) * 40));
      setAiResultCard({ ...best, match: matchPct, needDriver: aiNeedDriver === 'Yes', passengers: aiPassengers, tripDays: aiTripDays, budget: aiBudget });
      setAiLoading(false);
    }, 1200);
  };

  const handleRunAiComparison = () => {
    setCompareLoading(true);
    setTimeout(() => {
      const a = AI_CAR_DB[compareCarA] || AI_CAR_DB['Hyundai Creta'];
      const b = AI_CAR_DB[compareCarB] || AI_CAR_DB['Kia Seltos'];
      const aTotal = a.comfort + a.mileage + a.luggage + a.safety;
      const bTotal = b.comfort + b.mileage + b.luggage + b.safety;
      setCompareResult({ a: { ...a, name: compareCarA }, b: { ...b, name: compareCarB }, winner: aTotal >= bTotal ? compareCarA : compareCarB });
      setCompareLoading(false);
    }, 900);
  };

  const handleAiTripSuggest = () => {
    setAiTripLoading(true);
    setTimeout(() => {
      const tripDB = {
        'Ooty': { vehicle: 'SUV / MUV', fuel: 3800, stops: ['Mettupalayam', 'Coonoor', 'Rose Garden', 'Doddabetta Peak', 'Botanical Gardens', 'Emerald Lake'], distance: 280 },
        'Kodaikanal': { vehicle: 'SUV', fuel: 4200, stops: ['Coaker\'s Walk', 'Berijam Lake', 'Pillar Rocks', 'Silver Cascade Falls', 'Bryant Park', 'Vattakanal'], distance: 320 },
        'Munnar': { vehicle: 'SUV 4x4', fuel: 5500, stops: ['Eravikulam', 'Top Station', 'Mattupetty Dam', 'Echo Point', 'Chinnakanal', 'Blossom Garden'], distance: 450 },
        'Goa': { vehicle: 'Convertible / SUV', fuel: 6800, stops: ['Baga Beach', 'Dudhsagar Falls', 'Anjuna Flea', 'Fort Aguada', 'Old Goa', 'Chapora Fort'], distance: 600 },
        'Manali': { vehicle: 'SUV 4WD', fuel: 12000, stops: ['Rohtang Pass', 'Solang Valley', 'Hidimba Temple', 'Beas Kund', 'Kullu', 'Naggar Castle'], distance: 1100 },
        'Coorg': { vehicle: 'SUV', fuel: 3200, stops: ['Abbey Falls', 'Talacauvery', 'Raja\'s Seat', 'Harangi Dam', 'Nagarhole', 'Iruppu Falls'], distance: 260 },
      };
      const destKey = Object.keys(tripDB).find(k => aiTripDestination.toLowerCase().includes(k.toLowerCase())) || 'Ooty';
      const trip = tripDB[destKey];
      setAiTripResult({ ...trip, destination: destKey, days: aiTripDaysInput });
      setAiTripLoading(false);
    }, 1000);
  };

  // Floating AI Chatbot Assistant States
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: '👋 Hello! I am Royal Rent Cars AI Concierge. How can I assist with your vehicle reservation or luxury chauffeur request today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Partner Companies & Call Desk States
  const [selectedCompanyDetails, setSelectedCompanyDetails] = useState(null);
  const [partnerCompanies, setPartnerCompanies] = useState([]);

  // Booking & Vehicle Details Modal States
  const [detailVehicle, setDetailVehicle] = useState(null);
  const [bookingVehicle, setBookingVehicle] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [startDate, setStartDate] = useState('2026-07-28');
  const [endDate, setEndDate] = useState('2026-07-28');

  // New Customer Checkout & Confirmation Receipt States
  const [custName, setCustName] = useState(user?.name || '');
  const [custPhone, setCustPhone] = useState(user?.phone || '');
  const [custEmail, setCustEmail] = useState(user?.email || '');
  const [custPaymentMode, setCustPaymentMode] = useState('UPI');
  const [confirmedBookingReceipt, setConfirmedBookingReceipt] = useState(null);

  const [popularLocations, setPopularLocations] = useState([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch(`/api/locations?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await res.json();
        if (data.success) {
          setPopularLocations(data.data.filter(loc => loc.status === 'active'));
        }
      } catch (err) {
        console.error('Failed to fetch popular locations', err);
      }
    };
    fetchLocations();
  }, []);

  const handleConfirmNewCustomerBooking = async (e) => {
    if (e) e.preventDefault();
    if (!bookingVehicle) return;

    const bookingRef = 'BK-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    const days = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24))) || 1;
    const pricePerDay = Number(bookingVehicle.pricePerDay || 2000);
    const driverFee = searchMode === 'driver' ? 500 * days : 0;
    const grandTotal = (pricePerDay * days) + driverFee;

    const companyName = bookingVehicle.companyName || bookingVehicle.company?.name || 'DriveX Rentals';
    const companyLogo = bookingVehicle.companyLogo || bookingVehicle.company?.logo || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=100&q=80';

    const newBooking = {
      _id: 'bk_' + Date.now(),
      id: 'bk_' + Date.now(),
      bookingId: bookingRef,
      vehicleId: bookingVehicle._id || bookingVehicle.id,
      vehicleName: `${bookingVehicle.make} ${bookingVehicle.model}`,
      vehicleImage: bookingVehicle.imageUrl,
      customerName: custName || 'New Customer',
      customerPhone: custPhone || '+91 98765 43210',
      customerEmail: custEmail || 'customer@gmail.com',
      companyName: companyName,
      companyLogo: companyLogo,
      pickupLocation: searchLocation || 'gundalapatti',
      pickupDate: startDate,
      returnDate: endDate,
      days: days,
      bookingType: searchMode === 'driver' ? 'with_driver' : 'self-drive',
      hasDriver: searchMode === 'driver',
      driverAssigned: searchMode === 'driver' ? 'Chauffeur Assigned' : 'Self Drive',
      totalPrice: grandTotal,
      totalAmount: grandTotal,
      paymentMethod: custPaymentMode,
      status: 'Approved',
      paymentStatus: 'Paid',
      createdAt: new Date().toISOString()
    };

    // 1. Save booking to local storage registry so Company Admin Dashboard receives it!
    try {
      const existingCompanyBookings = JSON.parse(localStorage.getItem('company_bookings_list') || '[]');
      localStorage.setItem('company_bookings_list', JSON.stringify([newBooking, ...existingCompanyBookings]));

      const existingCustBookings = JSON.parse(localStorage.getItem('customer_bookings_list') || '[]');
      localStorage.setItem('customer_bookings_list', JSON.stringify([newBooking, ...existingCustBookings]));

      // 2. Save customer to company customer roster
      const existingCustomers = JSON.parse(localStorage.getItem('company_customers_list') || '[]');
      const newCustEntry = {
        id: 'c_' + Date.now(),
        name: custName || 'New Customer',
        phone: custPhone || '+91 98765 43210',
        email: custEmail || 'customer@gmail.com',
        trips: 1,
        rating: 5.0,
        docVerified: true,
        status: 'Active'
      };
      if (!existingCustomers.some(c => c.email === newCustEntry.email || c.phone === newCustEntry.phone)) {
        localStorage.setItem('company_customers_list', JSON.stringify([newCustEntry, ...existingCustomers]));
      }
    } catch (err) { }

    // 3. Post to backend API if available
    try {
      await fetch('/api/customer/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking)
      });
    } catch (err) { }

    setBookingVehicle(null);
    setConfirmedBookingReceipt(newBooking);
  };

  useEffect(() => {
    const fetchPartnersAndFleet = async () => {
      try {
        const res = await fetch('/api/customer/companies');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            // Filter out suspended or inactive companies strictly
            const activeCompanies = (data.companies || []).filter(c => c.status === 'active' || !c.status);
            setPartnerCompanies(activeCompanies);
          }
        }
      } catch (err) {
        console.warn('Error fetching partner companies:', err);
      }

      try {
        const vRes = await fetch('/api/customer/vehicles');
        if (vRes.ok) {
          const vData = await vRes.json();
          if (vData.success) {
            const activeVehicles = (vData.vehicles || []).filter(v => {
              const compStatus = v.companyId?.status || v.company?.status || 'active';
              return compStatus === 'active';
            });
            setSearchResults(activeVehicles);
          }
        }
      } catch (err) {
        console.warn('Error fetching initial vehicles:', err);
      }
    };
    fetchPartnersAndFleet();
  }, []);

  // Smart Distance & Route Rate Card Lookup for AI Chatbot
  const CITY_ROUTES = {
    'bangalore-salem': { from: 'Bangalore', to: 'Salem', km: 202, time: '3.5 hrs via NH44', selfDrive: '₹2,200 - ₹2,800', luxury: '₹4,000 - ₹5,200', toll: '₹240' },
    'salem-bangalore': { from: 'Salem', to: 'Bangalore', km: 202, time: '3.5 hrs via NH44', selfDrive: '₹2,200 - ₹2,800', luxury: '₹4,000 - ₹5,200', toll: '₹240' },
    'dharmapuri-salem': { from: 'Dharmapuri', to: 'Salem', km: 68, time: '1.2 hrs via NH44', selfDrive: '₹1,200 - ₹1,800', luxury: '₹2,500 - ₹3,500', toll: '₹85' },
    'salem-dharmapuri': { from: 'Salem', to: 'Dharmapuri', km: 68, time: '1.2 hrs via NH44', selfDrive: '₹1,200 - ₹1,800', luxury: '₹2,500 - ₹3,500', toll: '₹85' },
    'bangalore-dharmapuri': { from: 'Bangalore', to: 'Dharmapuri', km: 138, time: '2.5 hrs via NH44', selfDrive: '₹1,800 - ₹2,400', luxury: '₹3,500 - ₹4,500', toll: '₹165' },
    'dharmapuri-bangalore': { from: 'Dharmapuri', to: 'Bangalore', km: 138, time: '2.5 hrs via NH44', selfDrive: '₹1,800 - ₹2,400', luxury: '₹3,500 - ₹4,500', toll: '₹165' },
    'chennai-dharmapuri': { from: 'Chennai', to: 'Dharmapuri', km: 295, time: '5.5 hrs via NH48', selfDrive: '₹3,000 - ₹3,800', luxury: '₹5,500 - ₹7,000', toll: '₹380' },
    'dharmapuri-chennai': { from: 'Dharmapuri', to: 'Chennai', km: 295, time: '5.5 hrs via NH48', selfDrive: '₹3,000 - ₹3,800', luxury: '₹5,500 - ₹7,000', toll: '₹380' },
    'chennai-bangalore': { from: 'Chennai', to: 'Bangalore', km: 346, time: '6.5 hrs via NH48', selfDrive: '₹3,500 - ₹4,500', luxury: '₹6,500 - ₹8,500', toll: '₹440' },
    'bangalore-chennai': { from: 'Bangalore', to: 'Chennai', km: 346, time: '6.5 hrs via NH48', selfDrive: '₹3,500 - ₹4,500', luxury: '₹6,500 - ₹8,500', toll: '₹440' },
    'krishnagiri-salem': { from: 'Krishnagiri', to: 'Salem', km: 110, time: '2.0 hrs via NH44', selfDrive: '₹1,500 - ₹2,000', luxury: '₹3,000 - ₹4,000', toll: '₹120' },
    'salem-krishnagiri': { from: 'Salem', to: 'Krishnagiri', km: 110, time: '2.0 hrs via NH44', selfDrive: '₹1,500 - ₹2,000', luxury: '₹3,000 - ₹4,000', toll: '₹120' },
    'hosur-salem': { from: 'Hosur', to: 'Salem', km: 160, time: '2.8 hrs via NH44', selfDrive: '₹1,900 - ₹2,500', luxury: '₹3,600 - ₹4,800', toll: '₹190' },
    'salem-hosur': { from: 'Salem', to: 'Hosur', km: 160, time: '2.8 hrs via NH44', selfDrive: '₹1,900 - ₹2,500', luxury: '₹3,600 - ₹4,800', toll: '₹190' }
  };

  const handleSendChatMessage = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const newMessages = [...chatMessages, { sender: 'user', text: userText }];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);

    setTimeout(() => {
      let replyText = '';
      const q = userText.toLowerCase().replace(/banglore/g, 'bangalore');

      // 1. Detect City Route Calculation
      let matchedRoute = null;
      for (const [key, route] of Object.entries(CITY_ROUTES)) {
        const [c1, c2] = key.split('-');
        if (q.includes(c1) && q.includes(c2)) {
          matchedRoute = route;
          break;
        }
      }

      if (matchedRoute) {
        replyText = `🚗 **${matchedRoute.from} ➔ ${matchedRoute.to} Trip Fare Breakdown**:\n\n` +
          `• 📏 **Distance**: ~${matchedRoute.km} km (${matchedRoute.time})\n` +
          `• 🏎️ **Self-Drive Hatchback / Sedan**: ${matchedRoute.selfDrive} per day\n` +
          `• 👑 **Luxury Sedan / SUV**: ${matchedRoute.luxury} per day\n` +
          `• 👨‍✈️ **Chauffeur Driver Option**: +₹500 / day driver allowance\n` +
          `• 🛣️ **Estimated Highway Tolls**: ~${matchedRoute.toll}\n\n` +
          `👉 *Tip*: You can select **${matchedRoute.from}** as Pickup and **${matchedRoute.to}** as Drop-off in the Search Bar above to book instantly!`;
      } else if (q.includes('bangalore') || q.includes('salem') || q.includes('chennai') || q.includes('dharmapuri') || q.includes('hosur')) {
        replyText = `📍 **City Trip Estimate**: Trips between major South Indian hubs (Bangalore, Salem, Dharmapuri, Chennai, Hosur) start at ₹1,500/day for Hatchbacks and ₹3,500/day for Luxury SUVs (approx ₹12 - ₹18/km). Chauffeur service is +₹500/day. Specify your origin and destination (e.g. *Bangalore to Salem*) for exact route fare!`;
      } else if (q.includes('price') || q.includes('rate') || q.includes('how much') || q.includes('cost') || q.includes('rent') || q.includes('fare')) {
        replyText = `💰 **Royal Rent Cars Rate Card**:\n` +
          `• Hatchback / Mini: ₹1,499/day\n` +
          `• Sedan (Dzire / Etios): ₹2,199/day\n` +
          `• SUV (Innova / Creta): ₹3,499/day\n` +
          `• Luxury (BMW / Audi / Benz): ₹7,999/day\n\n` +
          `*Note: Tolls, Fuel, and State Taxes calculated dynamically at checkout.*`;
      } else {
        replyText = `💡 **Royal Rent Cars AI Concierge**: We provide instant self-drive and chauffeur-driven luxury car rentals across India! Ask me route pricing (e.g. *"Bangalore to Salem how much"*) or vehicle availability to get instant fare estimates!`;
      }

      setChatMessages((prev) => [...prev, { sender: 'ai', text: replyText }]);
      setChatLoading(false);
    }, 600);
  };

  const CITY_COORDINATES = {
    'gundalapatti': [12.1760, 78.1630],
    'naduhalli': [12.1760, 78.1520],
    'kadagathur': [12.1760, 78.1400],
    'semadakuppam': [12.1730, 78.1800],
    'thippampatti': [12.1550, 78.1760],
    'solaikottai': [12.1460, 78.1880],
    'pappinaickanahalli': [12.1480, 78.1500],
    'nayagankottai': [12.1460, 78.1710],
    'annasagaram': [12.1320, 78.1700],
    'settikarai': [12.1450, 78.1880],
    'sogathur': [12.1280, 78.1420],
    'virupakshipuram': [12.1220, 78.1480],
    'a.reddihalli': [12.1380, 78.1360],
    'thadangam': [12.1150, 78.1300],
    'thoppur': [11.9560, 78.0600],
    'mettur': [11.7862, 77.8008],
    'dharmapuri': [12.1357, 78.1560],
    'pidamaneri': [12.1290, 78.1620],
    'hogenakkal': [12.1158, 77.7761],
    'hogenakal': [12.1158, 77.7761],
    'pennagaram': [12.1385, 77.8920],
    'palacode': [12.3020, 78.0770],
    'harur': [12.0600, 78.4900],
    'pappireddipatti': [11.9160, 78.3660],
    'kadayampatti': [11.8840, 78.1150],
    'mecheri': [11.8380, 77.9500],
    'uthangarai': [12.2600, 78.5300],
    'salem': [11.6643, 78.1460],
    'yercaud': [11.7753, 78.2093],
    'krishnagiri': [12.5266, 78.2144],
    'hosur': [12.7409, 77.8253],
    'erode': [11.3410, 77.7172],
    'vellore': [12.9165, 79.1325],
    'tirupur': [11.1085, 77.3411],
    'tiruppur': [11.1085, 77.3411],
    'namakkal': [11.2189, 78.1674],
    'chennai': [13.0827, 80.2707],
    'coimbatore': [11.0168, 76.9558],
    'madurai': [9.9252, 78.1198],
    'trichy': [10.7905, 78.7047],
    'tiruchirappalli': [10.7905, 78.7047],
    'thiruvannamalai': [12.2253, 79.0747],
    'tiruvannamalai': [12.2253, 79.0747],
    'tirupattur': [12.4925, 78.5678],
    'tirupathur': [12.4925, 78.5678],
    'kanchipuram': [12.8342, 79.7036],
    'chengalpattu': [12.6820, 79.9800],
    'ranipet': [12.9270, 79.3330],
    'cuddalore': [11.7480, 79.7714],
    'villupuram': [11.9401, 79.4861],
    'pondicherry': [11.9416, 79.8083],
    'puducherry': [11.9416, 79.8083],
    'karur': [10.9601, 78.0766],
    'dindigul': [10.3673, 77.9803],
    'thanjavur': [10.7870, 79.1378],
    'thiruvarur': [10.7726, 79.6365],
    'nagapattinam': [10.7672, 79.8449],
    'ooty': [11.4102, 76.6950],
    'kodaikanal': [10.2381, 77.4892],
    'tenkasi': [8.9593, 77.3150],
    'tirunelveli': [8.7139, 77.7567],
    'kanyakumari': [8.0883, 77.5385],
    'nagercoil': [8.1833, 77.4119],
    'mumbai': [19.0760, 72.8777],
    'bangalore': [12.9716, 77.5946],
    'bengaluru': [12.9716, 77.5946],
    'delhi': [28.6139, 77.2090],
    'hyderabad': [17.3850, 78.4867],
    'kochi': [9.9312, 76.2673],
    'trivandrum': [8.5241, 76.9366]
  };

  const getCoordinatesForQuery = (query, isDropoff = false) => {
    if (!query || query.trim().length === 0) {
      return isDropoff ? [12.1357, 78.1560] : [11.9560, 78.0600];
    }
    const q = query.toLowerCase().trim();
    for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
      if (q.includes(key)) return coords;
    }
    // Fallback: Generate offset relative to Thoppur/Dharmapuri base
    let hash = 0;
    for (let i = 0; i < q.length; i++) hash = q.charCodeAt(i) + ((hash << 5) - hash);
    const latOffset = ((hash % 100) / 500) + (isDropoff ? 0.08 : 0.0);
    const lngOffset = (((hash >> 2) % 100) / 500) + (isDropoff ? 0.08 : 0.0);
    return [11.9560 + latOffset, 78.0600 + lngOffset];
  };

  // Dynamic Geocoding States
  const [pickupCoords, setPickupCoords] = useState([12.1760, 78.1630]);
  const [dropoffCoords, setDropoffCoords] = useState([12.1357, 78.1560]);

  // Real-time Async Geocoding Effect (Nominatim API + Local Registry)
  useEffect(() => {
    let isCancelled = false;

    const resolveCoords = async (query, isDropoff) => {
      if (!query || !query.trim()) return;
      const q = query.toLowerCase().trim();

      for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
        if (q.includes(key)) {
          if (!isCancelled) {
            if (isDropoff) setDropoffCoords(coords);
            else setPickupCoords(coords);
          }
          return;
        }
      }

      try {
        const searchQuery = q.includes('india') ? q : `${q}, Tamil Nadu, India`;
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=1`);
        const data = await res.json();
        if (!isCancelled && data && data.features && data.features.length > 0) {
          const lat = parseFloat(data.features[0].geometry.coordinates[1]);
          const lon = parseFloat(data.features[0].geometry.coordinates[0]);
          if (!isNaN(lat) && !isNaN(lon)) {
            if (isDropoff) setDropoffCoords([lat, lon]);
            else setPickupCoords([lat, lon]);
          }
        }
      } catch (err) {
        console.warn('Geocoding error:', err);
      }
    };

    const timer = setTimeout(() => {
      resolveCoords(searchLocation, false);
      resolveCoords(dropoffLocation || 'Dharmapuri', true);
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchLocation, dropoffLocation]);

  // Dynamically load Leaflet JS & CSS from CDN
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    }
  }, []);

  // Initialize & Update Leaflet Map when canvas mounts or coordinates change
  useEffect(() => {
    if (!leafletLoaded || !window.L) return;

    const container = document.getElementById('mapbox-interactive-map-canvas');
    if (!container) return;

    let map = leafletMap;

    if (!map) {
      if (container._leaflet_id) {
        container._leaflet_id = null;
        container.innerHTML = '';
      }

      try {
        map = window.L.map('mapbox-interactive-map-canvas', {
          center: pickupCoords,
          zoom: 11,
          zoomControl: true,
          attributionControl: false,
          dragging: true,
          scrollWheelZoom: true
        });

        window.L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          subdomains: ['0', '1', '2', '3'],
          attribution: '&copy; Google Maps',
          maxZoom: 20
        }).addTo(map);

        map._markersGroup = window.L.layerGroup().addTo(map);

        setTimeout(() => {
          if (map) map.invalidateSize();
        }, 200);

        setLeafletMap(map);
      } catch (err) {
        console.warn('Leaflet map init exception:', err);
      }
    } else {
      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 200);
    }

    if (map && map._markersGroup) {
      map._markersGroup.clearLayers();
      if (map._routePolyline) {
        map.removeLayer(map._routePolyline);
        map._routePolyline = null;
      }

      // 1. Pickup Marker (Blue)
      const pickupIcon = window.L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="display:flex; flex-direction:column; align-items:center;">
            <div style="background:#ffffff; color:#0f172a; padding:4px 8px; border-radius:8px; font-size:11px; font-weight:800; border:2px solid #2563eb; white-space:nowrap; box-shadow:0 4px 12px rgba(0,0,0,0.25);">
              Pickup: ${searchLocation || 'Thoppur'}
            </div>
            <div style="width: 12px; height: 12px; background: #2563eb; border: 2px solid #fff; border-radius: 50%; margin-top: 4px;"></div>
          </div>
        `,
        iconSize: [180, 50],
        iconAnchor: [90, 45]
      });
      window.L.marker(pickupCoords, { icon: pickupIcon }).addTo(map._markersGroup);

      // 2. Dropoff Marker (Red)
      const effectiveDropoffName = dropoffLocation || 'Dharmapuri';
      const dropoffIcon = window.L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="display:flex; flex-direction:column; align-items:center;">
            <div style="background:#ffffff; color:#0f172a; padding:4px 8px; border-radius:8px; font-size:11px; font-weight:800; border:2px solid #ef4444; white-space:nowrap; box-shadow:0 4px 12px rgba(0,0,0,0.25);">
              🏁 Drop-off: ${effectiveDropoffName}
            </div>
            <div style="width: 12px; height: 12px; background: #ef4444; border: 2px solid #fff; border-radius: 50%; margin-top: 4px;"></div>
          </div>
        `,
        iconSize: [180, 50],
        iconAnchor: [90, 45]
      });
      window.L.marker(dropoffCoords, { icon: dropoffIcon }).addTo(map._markersGroup);

      // 3. Draw Route Polyline connecting Pickup -> Dropoff
      const routeLine = window.L.polyline([pickupCoords, dropoffCoords], {
        color: '#2563eb',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.85
      }).addTo(map);
      map._routePolyline = routeLine;

      // 4. Fit bounds smoothly
      try {
        const bounds = window.L.latLngBounds([pickupCoords, dropoffCoords]);
        map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 13, duration: 1.0 });
      } catch (err) { }
    }

  }, [leafletLoaded, pickupCoords, dropoffCoords, searchLocation, dropoffLocation]);

  const handleSearchSubmit = async (e, directLoc) => {
    if (e) e.preventDefault();
    try {
      const params = new URLSearchParams();
      const loc = directLoc !== undefined ? directLoc : searchLocation;
      if (loc) params.append('location', loc);
      if (searchCategory) params.append('category', searchCategory);

      const res = await fetch(`/api/customer/vehicles?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        // Filter out vehicles belonging to suspended or non-active companies
        const activeVehicles = (data.vehicles || []).filter(v => {
          const compStatus = v.companyId?.status || v.company?.status || 'active';
          return compStatus === 'active';
        });
        setSearchResults(activeVehicles);
      }
    } catch (err) {
      console.warn('Search fetch error:', err);
    }
  };

  const INITIAL_PUBLISHED_FLEET = [
    {
      _id: 'v_toyota_2020_vaidee',
      id: 'v_toyota_2020_vaidee',
      make: 'Toyota',
      model: '2020',
      year: 2020,
      category: 'Luxury',
      pricePerDay: 1500,
      imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800',
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seats: 5,
      location: 'Krishnagiri Main Branch',
      companyName: 'Vaidee',
      companyPhone: '9517368420',
      companyOwnerEmail: 'vaidee@gmail.com',
      companyLogo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" rx="20" fill="%232563eb"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="52" font-family="sans-serif" font-weight="bold">V</text></svg>`
    }
  ];

  const getCompanyLogoForVehicle = (v) => {
    const email = (v.companyOwnerEmail || v.companyEmail || v.company?.ownerEmail || v.company?.email || (v.companyName?.toLowerCase().includes('vaidee') ? 'vaidee@gmail.com' : 'pooja@gmail.com')).trim().toLowerCase();
    const companyKey = email.replace(/[^a-z0-9]/g, '_');

    const savedLogo = localStorage.getItem(`company_logo_${companyKey}`);
    if (savedLogo) return savedLogo;

    if (v.companyLogo && !v.companyLogo.includes('unsplash')) return v.companyLogo;
    if (v.company?.logo && !v.company.logo.includes('unsplash')) return v.company.logo;

    const name = v.companyName || v.company?.name || (email.includes('vaidee') ? 'Vaidee Cars' : 'Pooja Cars');
    const firstChar = name.charAt(0).toUpperCase();

    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" rx="20" fill="%232563eb"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="52" font-family="sans-serif" font-weight="bold">${firstChar}</text></svg>`;
  };

  const localVehicles = (() => {
    try {
      const saved = localStorage.getItem('company_vehicles_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }
      localStorage.setItem('company_vehicles_list', JSON.stringify(INITIAL_PUBLISHED_FLEET));
      return INITIAL_PUBLISHED_FLEET;
    } catch {
      return INITIAL_PUBLISHED_FLEET;
    }
  })();

  const carOwnerVehicles = (() => {
    try {
      const approvedList = JSON.parse(localStorage.getItem('approved_car_owners') || '[]');
      return approvedList
        .filter(co => co.published !== false && co.isPublished !== false && (co.status === 'ACTIVE' || co.status === 'APPROVED' || co.status === 'Approved'))
        .map((co, idx) => ({
          _id: co.id || co._id || `co_v_${idx}`,
          id: co.id || co._id || `co_v_${idx}`,
          make: co.make || (co.carName || 'Hyundai').split(' ')[0],
          model: co.model || co.carName || 'Creta SX',
          year: co.year || 2024,
          category: co.category || 'SUV',
          pricePerDay: co.pricePerDay || 1500,
          imageUrl: co.image || co.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800',
          transmission: co.transmission || 'Manual',
          fuelType: co.fuelType || 'Petrol',
          seats: co.seats || 5,
          location: co.location || 'Dharmapuri',
          companyName: co.name || 'Vehicle Partner',
          companyPhone: co.phone || '+91 96301 47852',
          companyOwnerEmail: co.email || 'sathya@gmail.com',
          companyLogo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" rx="20" fill="%23059669"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="52" font-family="sans-serif" font-weight="bold">${(co.name || 'P').charAt(0).toUpperCase()}</text></svg>`
        }));
    } catch {
      return [];
    }
  })();

  const combinedVehicles = [...searchResults, ...localVehicles, ...carOwnerVehicles];

  // Show actual cars added by rental companies & vehicle partners
  const displayedFleet = combinedVehicles.length > 0 ? combinedVehicles : INITIAL_PUBLISHED_FLEET;

  return (
    <div style={{ background: '#ffffff', color: '#1c1917', fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* STICKY TOP NAVBAR HEADER (V2 FLEETMIND) */}
      <nav className="fleet-v2-nav">
        <button 
          className="fleet-v2-mobile-hamburger"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }} className="fleet-v2-nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#4a2c11', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(74, 44, 17, 0.3)' }}>R</div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1f140b', letterSpacing: '-0.3px' }}>Royal Rent <span style={{ color: '#b48555' }}>Cars</span></div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#6b5a4b', fontWeight: 700, marginTop: '-2px' }}>PREMIUM CAR RENTALS</div>
          </div>
        </div>

        <div className="fleet-v2-nav-links">
          <a href="#home" style={{ color: '#4a2c11', fontWeight: 800 }}>Home</a>
          <a href="#fleets">Cars</a>
          <a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); }}>About Us</a>
        </div>

        <div className="fleet-v2-nav-actions" style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <button className="fleet-v2-btn-outline fleet-v2-user-btn" onClick={() => navigate('/auth')}>
            👤 <span className="fleet-v2-user-name">{user ? user.name.split(' ')[0] : 'Login'}</span>
          </button>
          <button className="fleet-v2-btn-solid fleet-v2-partner-btn" onClick={() => setShowMultiRoleRegModal(true)}>
            🔥 Register / Partner
          </button>
        </div>

        {/* Mobile Menu Overlay Drawer */}
        {mobileMenuOpen && (
          <div className="fleet-v2-mobile-menu-drawer">
            <a href="#home" onClick={() => setMobileMenuOpen(false)}>🏠 Home</a>
            <a href="#fleets" onClick={() => setMobileMenuOpen(false)}>🏎️ Cars & Fleet</a>
            <a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); setMobileMenuOpen(false); }}>ℹ️ About Us</a>
            <a href="/contact" onClick={(e) => { e.preventDefault(); navigate('/contact'); setMobileMenuOpen(false); }}>📞 Contact Us</a>
            <hr style={{ border: 'none', borderTop: '1px solid #e2d7c5', margin: '0.5rem 0' }} />
            <button className="fleet-v2-btn-solid" onClick={() => { setShowMultiRoleRegModal(true); setMobileMenuOpen(false); }}>
              🔥 Register / Partner
            </button>
            <button className="fleet-v2-btn-outline" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>
              👤 {user ? `Profile (${user.name.split(' ')[0]})` : 'Login / Signup'}
            </button>
          </div>
        )}
      </nav>

      {/* 1. HERO BANNER SECTION WITH SEARCH CARD (ID: home) */}
      <section id="home" className="fleet-v2-hero">
        {/* Automatic Background Slideshow (2.5s cycle) */}
        <div className="fleet-v2-hero-slides">
          {HERO_IMAGES.map((imgUrl, idx) => (
            <div
              key={idx}
              className={`fleet-v2-hero-slide ${idx === heroBgIndex ? 'active' : ''}`}
              style={{ backgroundImage: `url('${imgUrl}')` }}
            />
          ))}
        </div>
        <div className="fleet-v2-hero-overlay" />

        <div className="fleet-v2-hero-content">

          {/* Left Text Column */}
          <div className="fleet-v2-hero-left">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fdfbf7', color: '#b48555', padding: '0.45rem 1.1rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700, marginBottom: '1.5rem', border: '1px solid #f2eadf', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <span>✨</span> AI-Powered Smart Car Rental Platform
            </div>

            <h1 className="fleet-v2-hero-title">
              Rent the <span>Perfect Car.</span><br />Every Time.
            </h1>

            <p className="fleet-v2-hero-subtitle">
              Find, book, and drive your ideal car with instant AI recommendations, real-time tracking, and transparent pricing.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
              <a href="#fleets" className="fleet-v2-btn-solid" style={{ textDecoration: 'none', padding: '0.85rem 1.8rem' }}>
                🚗 Rent a Car
              </a>
              <button className="fleet-v2-btn-outline" onClick={() => setShowMultiRoleRegModal(true)} style={{ padding: '0.85rem 1.8rem' }}>
                🏢 List Your Car
              </button>
            </div>

            <div className="fleet-v2-trust-badges">
              <span>🛡️ Best Price Guarantee</span>
              <span>📞 24/7 Customer Support</span>
              <span>🔒 100% Secure & Trusted</span>
            </div>
          </div>

          {/* Right Floating Search Widget */}
            <div className="fleet-v2-booking-card" style={{ paddingBottom: '2.5rem', overflow: 'visible' }}>
              <div className="fleet-v2-booking-tabs">
                <div
                  className={`fleet-v2-tab ${searchMode === 'self' ? 'active' : ''}`}
                  onClick={() => setSearchMode('self')}
                >
                  🏎️ Self Drive
                </div>
                <div
                  className={`fleet-v2-tab ${searchMode === 'driver' ? 'active' : ''}`}
                  onClick={() => setSearchMode('driver')}
                >
                  👨‍✈️ With Driver
                </div>
                <div
                  className="fleet-v2-tab"
                  onClick={() => setShowMultiRoleRegModal(true)}
                >
                  🏢 For Companies
                </div>
              </div>

              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div className="fleet-v2-input-group" style={{ position: 'relative', zIndex: 9999 }}>
                  <label>Pick-up Location</label>
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => { setSearchLocation(e.target.value); setShowLocationDropdown(true); }}
                    onFocus={() => setShowLocationDropdown(true)}
                    placeholder="Search city, district, state..."
                  />
                  {showLocationDropdown && searchLocation.trim().length >= 2 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '8px', maxHeight: '220px', overflowY: 'auto', boxShadow: '0 12px 30px rgba(0,0,0,0.12)', transition: 'all 0.3s ease' }}>
                      {searchLoading ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                          Searching...
                        </div>
                      ) : liveSuggestions.length > 0 ? (
                        liveSuggestions.map((loc, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => {
                              const displayName = loc.name || loc.city || loc.state || 'Selected Location';
                              setSearchLocation(displayName);
                              setPickupCoords([loc.lat, loc.lon]);
                              setShowLocationDropdown(false); 
                              handleSearchSubmit(null, displayName);
                            }} 
                            style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#1e293b', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '2px', transition: 'background 0.2s ease' }} 
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                            onMouseDown={e => e.preventDefault()}
                          >
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{loc.name || loc.city || loc.state}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {[loc.city, loc.state, loc.country].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                          No locations found
                        </div>
                      )}
                    </div>
                  )}
                  <style>{`
                    @keyframes spin { 100% { transform: rotate(360deg); } }
                  `}</style>
                </div>

              <div className="fleet-v2-input-group" style={{ position: 'relative', zIndex: 9998 }}>
                <label>Drop-off Location</label>
                <input
                  type="text"
                  value={dropoffLocation}
                  onChange={(e) => { setDropoffLocation(e.target.value); setShowDropoffDropdown(true); }}
                  onFocus={() => setShowDropoffDropdown(true)}
                  placeholder="Select drop-off location"
                />
                {showDropoffDropdown && dropoffLocation.trim().length >= 2 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '8px', maxHeight: '220px', overflowY: 'auto', boxShadow: '0 12px 30px rgba(0,0,0,0.12)', transition: 'all 0.3s ease' }}>
                    {dropoffLoading ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                        Searching...
                      </div>
                    ) : dropoffSuggestions.length > 0 ? (
                      dropoffSuggestions.map((loc, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => {
                            const displayName = loc.name || loc.city || loc.state || 'Selected Location';
                            setDropoffLocation(displayName);
                            setDropoffCoords([loc.lat, loc.lon]);
                            setShowDropoffDropdown(false); 
                          }} 
                          style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#1e293b', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '2px', transition: 'background 0.2s ease' }} 
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                          onMouseDown={e => e.preventDefault()}
                        >
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{loc.name || loc.city || loc.state}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {[loc.city, loc.state, loc.country].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                        No locations found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="fleet-v2-booking-grid" style={{ display: 'grid', gap: '0.8rem' }}>
                <div className="fleet-v2-input-group">
                  <label>Pick-up Date</label>
                  <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setTimeout(() => handleSearchSubmit(), 100); }} />
                </div>
                <div className="fleet-v2-input-group">
                  <label>Return Date</label>
                  <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setTimeout(() => handleSearchSubmit(), 100); }} />
                </div>
              </div>

              <div className="fleet-v2-input-group">
                <label>Vehicle Type</label>
                <select value={searchCategory} onChange={e => { setSearchCategory(e.target.value); setTimeout(() => handleSearchSubmit(), 100); }} style={{ width: '100%', background: '#faf8f5', border: '1px solid #e2d7c5', borderRadius: '8px', padding: '0.65rem 0.8rem', fontSize: '0.85rem', color: '#1f140b', outline: 'none' }}>
                  <option value="">All Types (Sedan, SUV, Luxury)</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1f140b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                AI Rental Assistant
              </div>
              <p style={{ color: '#6b5a4b', fontSize: '0.75rem', marginBottom: '0.5rem', marginTop: '0.2rem' }}>Let AI find your perfect car</p>
              <button 
                onClick={(e) => { e.preventDefault(); setShowAiModal(true); }} 
                type="button"
                style={{ width: '100%', padding: '0.85rem', background: '#4E311B', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(78, 49, 27, 0.3)' }}
              >
                Find My Perfect Car
              </button>
            </div>
          </div>

        </div>
      </section>


      {/* AI VEHICLE FINDER (Right below Hero) */}
      <section style={{ padding: '0 4%', marginTop: '2rem', position: 'relative', zIndex: 10, width: '100%', boxSizing: 'border-box' }}>
        
        {/* Main AI Card */}
        <div className="ai-finder-card" style={{ 
          background: '#FCF8F3', 
          border: '1px solid #C89B5B', 
          borderRadius: '22px', 
          padding: '2rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '2rem', 
          width: '100%', 
          boxShadow: '0 12px 30px rgba(59, 33, 19, 0.08)',
          boxSizing: 'border-box'
        }}>
          
          {/* Left Form Section */}
          <div className="ai-finder-left" style={{ flex: '1 1 50%', minWidth: '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <div style={{ width: '38px', height: '38px', background: '#F8F1E8', border: '1px solid #C89B5B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A321C' }}>
                <span style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.5px' }}>Ai<span style={{ fontSize: '0.75rem', color: '#C89B5B', verticalAlign: 'top' }}>✨</span></span>
              </div>
              <h3 style={{ color: '#3B2113', fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>AI Vehicle Finder</h3>
            </div>
            <p style={{ color: '#7A4A2A', fontSize: '0.82rem', marginBottom: '1.25rem', fontWeight: 500 }}>Tell us your trip details and our AI will find the perfect car for you.</p>

            <div className="ai-finder-inputs" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {/* Budget */}
              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '0.5rem 0.85rem', flex: 1, minWidth: '110px', display: 'flex', flexDirection: 'column', gap: '0.1rem', border: '1px solid #C89B5B', boxShadow: '0 2px 6px rgba(59, 33, 19, 0.03)' }}>
                <label style={{ color: '#7A4A2A', fontSize: '0.68rem', fontWeight: 600 }}>Budget</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <input type="text" placeholder="₹ 3000" value={aiBudget} onChange={e => setAiBudget(e.target.value)} style={{ width: '100%', border: 'none', color: '#3B2113', fontSize: '0.88rem', fontWeight: 700, outline: 'none', background: 'transparent' }} />
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7A4A2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>

              {/* Passengers */}
              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '0.5rem 0.85rem', flex: 1, minWidth: '90px', display: 'flex', flexDirection: 'column', gap: '0.1rem', border: '1px solid #C89B5B', boxShadow: '0 2px 6px rgba(59, 33, 19, 0.03)' }}>
                <label style={{ color: '#7A4A2A', fontSize: '0.68rem', fontWeight: 600 }}>Passengers</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <select value={aiPassengers} onChange={e => setAiPassengers(Number(e.target.value))} style={{ width: '100%', border: 'none', color: '#3B2113', fontSize: '0.88rem', fontWeight: 700, outline: 'none', background: 'transparent', appearance: 'none', cursor: 'pointer' }}>
                    <option value="2">2</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="7">7</option>
                  </select>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7A4A2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>

              {/* Trip Type */}
              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '0.5rem 0.85rem', flex: 1, minWidth: '90px', display: 'flex', flexDirection: 'column', gap: '0.1rem', border: '1px solid #C89B5B', boxShadow: '0 2px 6px rgba(59, 33, 19, 0.03)' }}>
                <label style={{ color: '#7A4A2A', fontSize: '0.68rem', fontWeight: 600 }}>Trip Type</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <select value={aiTripType} onChange={e => setAiTripType(e.target.value)} style={{ width: '100%', border: 'none', color: '#3B2113', fontSize: '0.88rem', fontWeight: 700, outline: 'none', background: 'transparent', appearance: 'none', cursor: 'pointer' }}>
                    <option value="Family">Family</option>
                    <option value="Business">Business</option>
                    <option value="Hills">Hills</option>
                  </select>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7A4A2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>

              {/* Need Driver */}
              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '0.5rem 0.85rem', flex: 1, minWidth: '90px', display: 'flex', flexDirection: 'column', gap: '0.1rem', border: '1px solid #C89B5B', boxShadow: '0 2px 6px rgba(59, 33, 19, 0.03)' }}>
                <label style={{ color: '#7A4A2A', fontSize: '0.68rem', fontWeight: 600 }}>Need Driver</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.1rem' }}>
                  <span style={{ fontSize: '0.88rem', color: '#3B2113', fontWeight: 700 }}>{aiNeedDriver}</span>
                  <div
                    onClick={() => setAiNeedDriver(prev => prev === 'Yes' ? 'No' : 'Yes')}
                    style={{ width: '22px', height: '22px', background: aiNeedDriver === 'Yes' ? '#5A321C' : '#F8F1E8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
                    {aiNeedDriver === 'Yes' ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg> : null}
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowAiModal(true)} 
              className="ai-finder-btn" 
              style={{ 
                width: 'auto', 
                padding: '0.85rem 1.75rem', 
                background: '#5A321C', 
                border: 'none', 
                borderRadius: '12px', 
                color: '#FFFFFF', 
                fontWeight: 700, 
                fontSize: '0.92rem', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem', 
                boxShadow: '0 6px 20px rgba(59, 33, 19, 0.2)', 
                transition: 'all 0.25s ease' 
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#3B2113'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#5A321C'; }}
            >
              <span style={{ fontSize: '1.05rem', color: '#C89B5B' }}>✨</span> Get AI Recommendation
            </button>
          </div>

          {/* Right Dedicated Image Container */}
          <div className="ai-finder-right" style={{ 
            flex: '0 0 48%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '20px', 
            background: '#FCF8F3', 
            borderRadius: '18px', 
            border: '1px solid #C89B5B',
            boxShadow: 'none',
            minHeight: '230px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <img 
              src={aiHeroGraphic} 
              alt="AI Robot and Car" 
              style={{ 
                width: '100%',
                height: '100%',
                maxHeight: '230px', 
                objectFit: 'contain', 
                display: 'block',
                margin: 'auto'
              }} 
            />
          </div>
        </div>

        {/* AI Result Card - Placed safely OUTSIDE the container to prevent any layout breaking when it appears */}
        {aiResultCard && (
          <div style={{ marginTop: '1.5rem', background: '#FCF8F3', border: '1px solid #C89B5B', padding: '1.15rem 1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 10px 25px rgba(59, 33, 19, 0.08)', maxWidth: '420px' }}>
            <img src={aiResultCard.img} style={{ width: '120px', borderRadius: '10px', border: '1px solid #C89B5B' }} alt="Result" />
            <div>
              <div style={{ fontWeight: 800, color: '#C89B5B', fontSize: '0.82rem', marginBottom: '0.2rem' }}>⭐ AI Best Match ({aiResultCard.match}%)</div>
              <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#3B2113' }}>{aiResultCard.car}</div>
              <div style={{ fontSize: '0.85rem', color: '#7A4A2A', marginTop: '0.2rem' }}>₹{aiResultCard.price}/day • {aiResultCard.seats} Seats</div>
            </div>
          </div>
        )}

        {/* STATS BAR */}
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', padding: '1.25rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', background: '#fff7ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a2 2 0 00-1.6-.8H9.3a2 2 0 00-1.6.8L5 11l-5.16.86a1 1 0 00-.84.99V16h3m10 0a2 2 0 11-4 0m4 0a2 2 0 10-4 0m-10 0a2 2 0 11-4 0m4 0a2 2 0 10-4 0"></path></svg>
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#0f172a' }}>5000+</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Cars Available</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', background: '#fff7ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M16 10h.01M8 10h.01M8 14h.01M12 14h.01M16 14h.01"></path></svg>
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#0f172a' }}>150+</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Top Car Companies</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', background: '#fff7ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#0f172a' }}>25K+</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Happy Customers</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', background: '#fff7ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path></svg>
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#0f172a' }}>98%</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* 1. AI RECOMMENDS THE BEST FOR YOU (FLEET CATALOG) */}
      <section id="fleets" className="fleet-v2-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="fleet-v2-section-title">AI Recommends the Best for You</h2>
            <p className="fleet-v2-section-subtitle" style={{ marginBottom: 0 }}>Our AI analyzes your preferences to suggest the perfect cars.</p>
          </div>
          <button className="fleet-v2-btn-outline" onClick={() => navigate('/cars')}>
            View All Cars
          </button>
        </div>

        {displayedFleet.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2d7c5' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🏎️</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1c1917', marginBottom: '0.35rem' }}>No Cars Published Yet</h3>
            <p style={{ color: '#57534e', fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto 1.2rem auto' }}>
              Vehicles published by active rental agencies will appear here live on the catalog.
            </p>
            <button onClick={() => setShowMultiRoleRegModal(true)} className="fleet-v2-btn-solid">
              + Register & List Your Car
            </button>
          </div>
        ) : (
          <div className="fleet-v2-car-grid">
            {displayedFleet.slice(0, 6).map((v, idx) => (
              <div
                key={v._id ? `${v._id}-${idx}` : `fleet-${idx}`}
                className="fleet-v2-car-card"
                onClick={() => setDetailVehicle(v)}
              >
                <div style={{ position: 'relative' }}>
                  <span className="fleet-v2-car-badge">🔥 {98 - (idx % 5)}% Match</span>
                  <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: '#dc2626', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                    ♡
                  </span>
                  <img
                    src={getValidImageUrl(v.imageUrl, 'vehicle')}
                    onError={e => handleImageError(e, 'vehicle')}
                    alt={v.model}
                    className="fleet-v2-car-img"
                  />
                </div>

                <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div className="fleet-v2-car-title">{v.make} {v.model}</div>

                  <div className="fleet-v2-car-specs">
                    <span>💺 {v.seats || 5} Seats</span>
                    <span>⛽ {v.fuelType || 'Petrol'}</span>
                    <span>⚙️ {v.transmission || 'Automatic'}</span>
                  </div>

                  {/* Operator & Call Button */}
                  <div style={{ background: '#faf8f5', border: '1px solid #f2eadf', padding: '0.45rem 0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img
                        src={getCompanyLogoForVehicle(v)}
                        alt="Operator Logo"
                        style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }}
                        onError={(e) => {
                          const name = v.companyName || v.company?.name || 'Vaidee';
                          const char = name.charAt(0).toUpperCase();
                          e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" rx="20" fill="%232563eb"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-size="52" font-family="sans-serif" font-weight="bold">${char}</text></svg>`;
                        }}
                      />
                      <span style={{ color: '#1f140b', fontWeight: 700 }}>{v.companyName || v.company?.name || 'Verified Fleet'}</span>
                    </div>
                    <a
                      href={`tel:${v.companyPhone || v.companyMobile || v.company?.mobile || v.company?.phone || '9517368420'}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: '#2563eb', fontWeight: 800, textDecoration: 'none', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.2rem 0.5rem', borderRadius: '6px' }}
                    >
                      📞 Call
                    </a>
                  </div>

                  <div className="fleet-v2-car-price-row" style={{ marginTop: 'auto' }}>
                    <div>
                      <span className="fleet-v2-price">₹{v.pricePerDay}</span>
                      <span style={{ fontSize: '0.78rem', color: '#6b5a4b' }}> / day</span>
                    </div>
                    <div className="fleet-v2-rating">⭐ 4.8 ({120 + idx * 7})</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.85rem' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDetailVehicle(v); }}
                      className="fleet-v2-btn-outline"
                      style={{ padding: '0.55rem', fontSize: '0.78rem' }}
                    >
                      Details
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setBookingVehicle(v); }}
                      className="fleet-v2-btn-solid"
                      style={{ padding: '0.55rem', fontSize: '0.78rem' }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {displayedFleet.length > 6 && (
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <button className="fleet-v2-btn-solid" onClick={() => navigate('/cars')} style={{ padding: '0.8rem 2rem', fontSize: '1.05rem', fontWeight: 800 }}>
              Explore All {displayedFleet.length} Cars
            </button>
          </div>
        )}
      </section>


      {/* 3. WHY CHOOSE ROYAL RENTAL CARS? */}
      <FeatureCards />


      {/* 4. GROW YOUR CAR RENTAL BUSINESS BANNER (EXACT SCREENSHOT MATCH) */}
      <section className="fleet-v2-section" style={{ paddingBottom: '1.5rem' }}>
        <div className="fleet-v2-banner">
          <div className="fleet-v2-banner-content">
            <span className="fleet-v2-banner-badge">For Rental Companies</span>
            <h2 className="fleet-v2-banner-title">Grow Your Car Rental Business</h2>
            <p className="fleet-v2-banner-desc">
              List your cars, get more bookings and manage everything in one place.
            </p>
            <button className="fleet-v2-banner-btn" onClick={() => setShowMultiRoleRegModal(true)}>
              Register Your Company ➔
            </button>
          </div>
          <div className="fleet-v2-banner-right-bg" />
        </div>
      </section>

      {/* 5. POPULAR LOCATIONS (EXACT SCREENSHOT MATCH) */}
      <section className="fleet-v2-section" style={{ paddingTop: '0.5rem', paddingBottom: '2.5rem' }}>
        <h2 className="fleet-v2-section-title" style={{ fontSize: '2.2rem', marginBottom: '0.2rem' }}>Popular Locations</h2>
        <p className="fleet-v2-section-subtitle" style={{ marginBottom: '1.75rem' }}>Explore cars in top cities</p>

        <div className="fleet-v2-locations-wrapper">
          <div className="fleet-v2-locations">
            {popularLocations.length > 0 ? (
              popularLocations.map((loc) => (
                <div key={loc._id} className="fleet-v2-location-card">
                  <img src={loc.imageUrl || 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=400'} alt={loc.name} />
                  <div>
                    <div className="fleet-v2-location-name">{loc.name}</div>
                    <div className="fleet-v2-location-count">{loc.carsCount > 0 ? `${loc.carsCount}+` : '0+'} Cars</div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="fleet-v2-location-card">
                  <img src="https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=400" alt="Bangalore" />
                  <div>
                    <div className="fleet-v2-location-name">Bangalore</div>
                    <div className="fleet-v2-location-count">1200+ Cars</div>
                  </div>
                </div>
                <div className="fleet-v2-location-card">
                  <img src="https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=400" alt="Chennai" />
                  <div>
                    <div className="fleet-v2-location-name">Chennai</div>
                    <div className="fleet-v2-location-count">950+ Cars</div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="fleet-v2-next-arrow">›</div>
        </div>
      </section>


      {/* 6. READY TO HIT THE ROAD? PRE-FOOTER BANNER (EXACT SCREENSHOT MATCH) */}
      <section style={{ padding: '0 4%' }}>
        <div className="fleet-v2-prefooter">
          <div className="fleet-v2-prefooter-left">
            <img
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80"
              alt="Sports Car Cutout"
              className="fleet-v2-prefooter-car-img"
            />
            <div>
              <div className="fleet-v2-prefooter-title">Ready to hit the road?</div>
              <p className="fleet-v2-prefooter-desc">Book your perfect car now and enjoy a seamless journey.</p>
            </div>
          </div>
          <button
            className="fleet-v2-prefooter-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Find My Car ➔
          </button>
        </div>
      </section>

      {/* 7. FOOTER (EXACT MATCH TO SCREENSHOT 401) */}
      <footer id="contact" style={{ background: '#3b2313', color: '#e5e7eb', padding: '3rem 5%', fontFamily: "'Inter', sans-serif" }}>
        <div className="fleet-v2-footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.2fr', gap: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2rem', marginBottom: '1.5rem' }}>
          
          {/* Logo Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
              <div style={{ color: '#d4af37', fontSize: '2rem' }}>👑</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#d4af37', fontSize: '1.2rem', fontWeight: 900, letterSpacing: '1px', lineHeight: 1 }}>ROYAL</span>
                <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px' }}>RENTAL CARS</span>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#d1d5db', lineHeight: 1.6, marginBottom: '1.5rem', maxWidth: '280px' }}>
              We are committed to giving you the best car rental experience with transparency, safety and trust.
            </p>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>f</div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>📷</div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>🐦</div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>in</div>
            </div>
          </div>

          {/* Col 1 */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.2rem' }}>For Customers</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem', color: '#d1d5db' }}>
              <li style={{ cursor: 'pointer' }} onClick={() => navigate('/info')}>Browse Cars</li>
              <li style={{ cursor: 'pointer' }} onClick={() => navigate('/info')}>How It Works</li>
              <li style={{ cursor: 'pointer' }} onClick={() => navigate('/info')}>Pricing</li>
              <li style={{ cursor: 'pointer' }} onClick={() => navigate('/info')}>FAQs</li>
            </ul>
          </div>

          {/* Col 2 */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.2rem' }}>For Companies</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem', color: '#d1d5db' }}>
              <li style={{ cursor: 'pointer' }} onClick={() => navigate('/info')}>List Your Car</li>
              <li style={{ cursor: 'pointer' }} onClick={() => navigate('/auth')}>Company Login</li>
              <li style={{ cursor: 'pointer' }} onClick={() => navigate('/info')}>Partner With Us</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.2rem' }}>Support</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem', color: '#d1d5db' }}>
              <li style={{ cursor: 'pointer' }} onClick={() => navigate('/info')}>Help Center</li>
              <li style={{ cursor: 'pointer' }} onClick={() => navigate('/info')}>Contact Support</li>
              <li style={{ cursor: 'pointer' }} onClick={() => navigate('/info')}>Cancellation Policy</li>
              <li style={{ cursor: 'pointer' }} onClick={() => navigate('/info')}>Refund Policy</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.2rem' }}>Contact Us</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', color: '#d1d5db' }}>
              <li style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#d4af37' }}>📞</span>
                <span>+91 98765 43210</span>
              </li>
              <li style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#d4af37' }}>✉️</span>
                <span>support@royalrentcars.com</span>
              </li>
              <li style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#d4af37' }}>🏠</span>
                <span>123, Royal Street, Chennai,<br/>Tamil Nadu - 600001</span>
              </li>
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#9ca3af' }}>
          <div>© 2024 Royal Rental Cars. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/info')}>Terms & Conditions</span>
            <span>|</span>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/info')}>Privacy Policy</span>
          </div>
        </div>
      </footer>



      {/* MODAL: OPERATOR CALL DESK */}
      {selectedCompanyDetails && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', padding: '1.75rem', background: '#0b0f17', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>🏢 Fleet Operator Contact</h3>
              <button className="close-btn" onClick={() => setSelectedCompanyDetails(null)}>×</button>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6' }}>{selectedCompanyDetails.name}</div>
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '0.2rem' }}>📞 Phone: <strong>{selectedCompanyDetails.phone}</strong></div>
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>📧 Email: <strong>{selectedCompanyDetails.email}</strong></div>
              </div>
              <a href={`tel:${selectedCompanyDetails.phone}`} style={{ display: 'block', textAlign: 'center', background: '#2563eb', color: '#ffffff', textDecoration: 'none', padding: '0.65rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.88rem' }}>
                📞 Call Operator Direct
              </a>
            </div>
          </div>
        </div>
      )}

      {/* NEW & EXISTING CUSTOMER INSTANT BOOKING WIZARD MODAL */}
      {bookingVehicle && (
        <div className="modal-overlay" style={{ zIndex: 1200, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(6px)' }}>
          <div className="modal-content" style={{ maxWidth: '520px', width: '92%', maxHeight: '92vh', overflowY: 'auto', padding: '1.75rem', background: '#0b0f17', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '16px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: '#38bdf8', margin: 0 }}>
                🚗 Reserve {bookingVehicle.make} {bookingVehicle.model}
              </h3>
              <button className="close-btn" onClick={() => setBookingVehicle(null)} style={{ color: '#fff', fontSize: '1.4rem' }}>×</button>
            </div>

            <div style={{ marginTop: '1rem' }}>
              {/* Vehicle & Published Operator Summary Header */}
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <img src={getValidImageUrl(bookingVehicle.imageUrl, 'vehicle')} onError={e => handleImageError(e, 'vehicle')} alt="Car" style={{ width: '90px', height: '62px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }} />
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc' }}>{bookingVehicle.make} {bookingVehicle.model}</div>
                    <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 800 }}>₹{bookingVehicle.pricePerDay}/day</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{searchLocation || bookingVehicle.location || 'gundalapatti'}</div>
                  </div>
                </div>

                {/* Published Operator Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', borderTop: '1px dashed #334155', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                  <img
                    src={bookingVehicle.companyLogo || bookingVehicle.company?.logo || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=100&q=80'}
                    alt="Company Logo"
                    style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }}
                  />
                  <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                    Verified Operator: <strong style={{ color: '#38bdf8' }}>{bookingVehicle.companyName || bookingVehicle.company?.name || 'DriveX Rentals'}</strong>
                  </span>
                </div>
              </div>

              {/* Customer Booking Form */}
              <form onSubmit={handleConfirmNewCustomerBooking}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.35rem' }}>
                    👤 Customer Information (Instant Reservation)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.25rem', display: 'block' }}>Full Name *</label>
                      <input type="text" required value={custName} onChange={e => setCustName(e.target.value)} placeholder="e.g. Ramesh Kumar" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.25rem', display: 'block' }}>Phone Number *</label>
                      <input type="text" required value={custPhone} onChange={e => setCustPhone(e.target.value)} placeholder="+91 98765 43210" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.25rem', display: 'block' }}>Email Address *</label>
                    <input type="email" required value={custEmail} onChange={e => setCustEmail(e.target.value)} placeholder="customer@gmail.com" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }} />
                  </div>

                  {/* Dates & Rental Service Option */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.25rem', display: 'block' }}>Pickup Date</label>
                      <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.25rem', display: 'block' }}>Return Date</label>
                      <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.25rem', display: 'block' }}>Chauffeur Option</label>
                    <select value={searchMode} onChange={e => setSearchMode(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}>
                      <option value="self">🏎️ Self-Drive Rental</option>
                      <option value="driver">👨‍✈️ Car + Chauffeur Driver (+₹500/day)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.25rem', display: 'block' }}>Payment Method</label>
                    <select value={custPaymentMode} onChange={e => setCustPaymentMode(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.5rem', color: '#fff', fontSize: '0.82rem', outline: 'none' }}>
                      <option value="UPI">⚡ UPI / GPay / PhonePe</option>
                      <option value="Card">💳 Credit / Debit Card</option>
                      <option value="Cash">💵 Pay Cash on Pickup</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    style={{ width: '100%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#ffffff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontWeight: 900, fontSize: '0.92rem', cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}
                  >
                    💳 Confirm & Place Booking Now
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* INSTANT CONFIRMED BOOKING RECEIPT MODAL */}
      {confirmedBookingReceipt && (
        <div className="modal-overlay" style={{ zIndex: 1300, background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-content" style={{ maxWidth: '480px', width: '92%', padding: '1.75rem', background: '#ffffff', color: '#0f172a', borderRadius: '16px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.3rem' }}>🎉</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#166534', margin: 0 }}>
                Booking Confirmed & Reserved!
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                Your reservation has been sent directly to the fleet operator.
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: '#64748b' }}>Booking ID:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#1e40af', background: '#dbeafe', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>#{confirmedBookingReceipt.bookingId}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', background: '#0f172a', padding: '0.45rem 0.75rem', borderRadius: '8px', color: '#fff', marginBottom: '0.75rem' }}>
                <img src={confirmedBookingReceipt.companyLogo} alt="Logo" style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }} />
                <span style={{ fontSize: '0.76rem' }}>Verified Operator: <strong style={{ color: '#38bdf8' }}>{confirmedBookingReceipt.companyName}</strong></span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div><strong>Vehicle:</strong> {confirmedBookingReceipt.vehicleName}</div>
                <div><strong>Customer Name:</strong> {confirmedBookingReceipt.customerName} ({confirmedBookingReceipt.customerPhone})</div>
                <div><strong>Pickup Location:</strong> {confirmedBookingReceipt.pickupLocation}</div>
                <div><strong>Pickup Date:</strong> {confirmedBookingReceipt.pickupDate}</div>
                <div><strong>Return Date:</strong> {confirmedBookingReceipt.returnDate}</div>
                <div><strong>Driver Service:</strong> {confirmedBookingReceipt.bookingType === 'with_driver' ? 'Car + Chauffeur Driver' : 'Self-Drive'}</div>
                <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '0.4rem', marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: 900, color: '#15803d' }}>
                  <span>Total Amount Paid:</span>
                  <span>₹{confirmedBookingReceipt.totalPrice}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => window.print()}
                style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '0.65rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                🖨️ Print / Save Receipt
              </button>
              <button
                onClick={() => setConfirmedBookingReceipt(null)}
                style={{ flex: 1, background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '0.65rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Close & Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ZOOMCAR & MEESHO-STYLE VEHICLE DETAILS */}
      {detailVehicle && (
        <VehicleDetailsModal
          vehicle={detailVehicle}
          allFleet={displayedFleet}
          user={user}
          searchLocation={searchLocation}
          onClose={() => setDetailVehicle(null)}
          onSelectVehicle={(v) => setDetailVehicle(v)}
          onProceedBook={(v) => {
            setDetailVehicle(null);
            setBookingVehicle(v);
            setCheckoutStep(1);
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          MULTI-ROLE REGISTRATION POPUP MODAL
      ───────────────────────────────────────────────────────────── */}
      {showMultiRoleRegModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '640px', borderRadius: '24px', padding: '2.2rem', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0', position: 'relative', animation: 'fadeIn 0.25s ease-out' }}>

            {/* Close Button */}
            <button
              onClick={() => { setShowMultiRoleRegModal(false); setSelectedRegRole(null); setRegSuccessNotice(''); }}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', color: '#64748b' }}
            >
              ✕
            </button>

            {regSuccessNotice ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.25rem auto' }}>
                  ✓
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.75rem' }}>Application Submitted Successfully!</h3>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  {regSuccessNotice}
                </p>
                <button
                  onClick={() => { setShowMultiRoleRegModal(false); setSelectedRegRole(null); setRegSuccessNotice(''); }}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  Done & Back to Home
                </button>
              </div>
            ) : !selectedRegRole ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1px' }}>Partner & Earn</span>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0.2rem 0 0.4rem 0' }}>What would you like to register as?</h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Choose your role to get started with zero upfront fee</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                  {/* Option 1: Car Owner */}
                  <div
                    onClick={() => setSelectedRegRole('car_owner')}
                    style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s ease-out' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                  >
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                      🚗
                    </div>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Register as Car Owner</div>
                    </div>
                  </div>

                  {/* Option 2: Driver */}
                  <div
                    onClick={() => setSelectedRegRole('driver')}
                    style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s ease-out' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.background = '#f0fdf4'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                  >
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                      👨‍✈️
                    </div>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Register as Driver</div>
                    </div>
                  </div>

                  {/* Option 3: Rental Business */}
                  <div
                    onClick={() => setSelectedRegRole('company')}
                    style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '16px', padding: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s ease-out' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.background = '#faf5ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                  >
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                      🏢
                    </div>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Register as Rental Business</div>
                    </div>
                  </div>

                </div>
              </div>
            ) : selectedRegRole === 'car_owner' ? (
              /* FORM 1: CAR OWNER REGISTRATION */
              <form onSubmit={e => {
                e.preventDefault();
                if (!ownerFormData.insuranceFileName || !ownerFormData.rcFileName || !ownerFormData.aadhaarFileName) {
                  setOwnerDocError('⚠️ Document upload is COMPULSORY! Please select Insurance Document, RC Book File, and Aadhaar Card File before submitting.');
                  return;
                }
                setOwnerDocError('');
                const existing = JSON.parse(localStorage.getItem('pending_car_owners') || '[]');
                const newOwner = {
                  id: 'co_' + Date.now(),
                  ...ownerFormData,
                  status: 'PENDING_APPROVAL',
                  termsAccepted: false,
                  isPublished: false,
                  fixedDailyEarnings: 500,
                  pricePerDay: 1500,
                  createdAt: new Date().toISOString()
                };

                localStorage.setItem('pending_car_owners', JSON.stringify([newOwner, ...existing]));

                // Notify Super Admin
                const notif = {
                  _id: 'notif_co_' + Date.now(),
                  title: '🚗 New Car Owner Registration (PENDING_APPROVAL)',
                  message: `New car owner partner ${ownerFormData.name} (${ownerFormData.phone}) registered ${ownerFormData.carName || 'vehicle'} (${ownerFormData.plate}). Status: PENDING_APPROVAL. Awaiting document verification.`,
                  senderRole: 'car-owner',
                  createdAt: new Date().toISOString()
                };
                const existingNotifs = JSON.parse(localStorage.getItem('notifications_super_admin') || '[]');
                localStorage.setItem('notifications_super_admin', JSON.stringify([notif, ...existingNotifs]));

                const ownerUser = {
                  _id: newOwner.id,
                  name: ownerFormData.name || 'Car Owner Partner',
                  email: ownerFormData.email,
                  role: 'car-owner',
                  status: 'PENDING_APPROVAL',
                  termsAccepted: false
                };
                sessionStorage.setItem('token', 'mock_owner_token_' + Date.now());
                localStorage.setItem('car_owner_user', JSON.stringify(ownerUser));
                setUser(ownerUser);
                navigate('/car-owner-dashboard');
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button type="button" onClick={() => { setSelectedRegRole(null); setOwnerDocError(''); }} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>← Back</button>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>🚗 Register as Car Owner</h3>
                </div>

                {ownerDocError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem' }}>
                    {ownerDocError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Owner Full Name *</label>
                    <input type="text" required placeholder="e.g. Kumar S." value={ownerFormData.name} onChange={e => setOwnerFormData({ ...ownerFormData, name: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Phone Number *</label>
                    <input type="text" required placeholder="+91 98765 43210" value={ownerFormData.phone} onChange={e => setOwnerFormData({ ...ownerFormData, phone: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Email Address *</label>
                    <input type="email" required placeholder="kumar@gmail.com" value={ownerFormData.email} onChange={e => setOwnerFormData({ ...ownerFormData, email: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Create Password 🔐 *</label>
                    <input type="password" required placeholder="••••••••" value={ownerFormData.password} onChange={e => setOwnerFormData({ ...ownerFormData, password: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Aadhaar Number *</label>
                    <input type="text" required placeholder="XXXX-XXXX-9988" value={ownerFormData.aadhaar} onChange={e => setOwnerFormData({ ...ownerFormData, aadhaar: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Car Name & Model *</label>
                    <input type="text" required placeholder="e.g. Hyundai Creta" value={ownerFormData.carName} onChange={e => setOwnerFormData({ ...ownerFormData, carName: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Vehicle Registration Plate No *</label>
                    <input type="text" required placeholder="e.g. TN29AB1234" value={ownerFormData.plate} onChange={e => setOwnerFormData({ ...ownerFormData, plate: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>

                  {/* FILE UPLOADS: INSURANCE, RC, AADHAAR */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: ownerDocError && !ownerFormData.insuranceFileName ? '#dc2626' : '#2563eb' }}>📄 Upload Insurance Document (Compulsory) *</label>
                    <input type="file" required accept=".pdf,image/*" onChange={e => setOwnerFormData({ ...ownerFormData, insuranceFileName: e.target.files[0]?.name || '' })} style={{ width: '100%', padding: '0.4rem', borderRadius: '8px', border: ownerDocError && !ownerFormData.insuranceFileName ? '1.5px solid #dc2626' : '1px dashed #2563eb', fontSize: '0.78rem', background: '#eff6ff' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: ownerDocError && !ownerFormData.rcFileName ? '#dc2626' : '#2563eb' }}>📄 Upload RC Book File (Compulsory) *</label>
                    <input type="file" required accept=".pdf,image/*" onChange={e => setOwnerFormData({ ...ownerFormData, rcFileName: e.target.files[0]?.name || '' })} style={{ width: '100%', padding: '0.4rem', borderRadius: '8px', border: ownerDocError && !ownerFormData.rcFileName ? '1.5px solid #dc2626' : '1px dashed #2563eb', fontSize: '0.78rem', background: '#eff6ff' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: ownerDocError && !ownerFormData.aadhaarFileName ? '#dc2626' : '#2563eb' }}>🪪 Upload Aadhaar Card File (Compulsory) *</label>
                    <input type="file" required accept=".pdf,image/*" onChange={e => setOwnerFormData({ ...ownerFormData, aadhaarFileName: e.target.files[0]?.name || '' })} style={{ width: '100%', padding: '0.4rem', borderRadius: '8px', border: ownerDocError && !ownerFormData.aadhaarFileName ? '1.5px solid #dc2626' : '1px dashed #2563eb', fontSize: '0.78rem', background: '#eff6ff' }} />
                  </div>
                </div>

                <button type="submit" style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '10px', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer' }}>
                  🚀 Submit Application to Super Admin
                </button>
              </form>
            ) : selectedRegRole === 'driver' ? (
              /* FORM 2: DRIVER REGISTRATION */
              <form onSubmit={e => {
                e.preventDefault();
                if (!driverFormData.licenceFileName || !driverFormData.faceFileName || !driverFormData.aadhaarFileName) {
                  setDriverDocError('⚠️ Document upload is COMPULSORY! Please select Driving Licence Photo, Face Selfie, and Aadhaar Document before submitting.');
                  return;
                }
                setDriverDocError('');
                const existing = JSON.parse(localStorage.getItem('pending_drivers') || '[]');
                const newDriver = { id: 'drv_' + Date.now(), ...driverFormData, status: 'Pending Approval', createdAt: new Date().toISOString() };
                localStorage.setItem('pending_drivers', JSON.stringify([newDriver, ...existing]));

                // Notify Super Admin
                const notif = {
                  _id: 'notif_drv_' + Date.now(),
                  title: '👨‍✈️ New Driver Application',
                  message: `New chauffeur driver ${driverFormData.name} (${driverFormData.phone}) applied from ${driverFormData.location}. Awaiting DL verification.`,
                  senderRole: 'driver',
                  createdAt: new Date().toISOString()
                };
                const existingNotifs = JSON.parse(localStorage.getItem('notifications_super_admin') || '[]');
                localStorage.setItem('notifications_super_admin', JSON.stringify([notif, ...existingNotifs]));

                setRegSuccessNotice(`Driver application for "${driverFormData.name}" submitted! Status: PENDING Super Admin Approval. You can log in with your email (${driverFormData.email}) once Super Admin approves your application.`);
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button type="button" onClick={() => { setSelectedRegRole(null); setDriverDocError(''); }} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>← Back</button>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>👨‍✈️ Register as Driver</h3>
                </div>

                {driverDocError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem' }}>
                    {driverDocError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Driver Full Name *</label>
                    <input type="text" required placeholder="e.g. Ravi Kumar" value={driverFormData.name} onChange={e => setDriverFormData({ ...driverFormData, name: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Phone Number *</label>
                    <input type="text" required placeholder="+91 98421 11223" value={driverFormData.phone} onChange={e => setDriverFormData({ ...driverFormData, phone: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Email Address *</label>
                    <input type="email" required placeholder="ravi@driver.com" value={driverFormData.email} onChange={e => setDriverFormData({ ...driverFormData, email: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Create Password 🔐 *</label>
                    <input type="password" required placeholder="••••••••" value={driverFormData.password} onChange={e => setDriverFormData({ ...driverFormData, password: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Driving Licence No *</label>
                    <input type="text" required value={driverFormData.licenceNo} onChange={e => setDriverFormData({ ...driverFormData, licenceNo: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Driving Experience *</label>
                    <input type="text" required value={driverFormData.experience} onChange={e => setDriverFormData({ ...driverFormData, experience: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Base Location *</label>
                    <input type="text" required value={driverFormData.location} onChange={e => setDriverFormData({ ...driverFormData, location: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                  </div>

                  {/* FILE UPLOADS: LICENCE PHOTO, FACE PHOTO, AADHAAR */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: driverDocError && !driverFormData.licenceFileName ? '#dc2626' : '#059669' }}>📸 Upload Licence Photo (Compulsory) *</label>
                    <input type="file" required accept="image/*,.pdf" onChange={e => setDriverFormData({ ...driverFormData, licenceFileName: e.target.files[0]?.name || '' })} style={{ width: '100%', padding: '0.4rem', borderRadius: '8px', border: driverDocError && !driverFormData.licenceFileName ? '1.5px solid #dc2626' : '1px dashed #059669', fontSize: '0.78rem', background: '#f0fdf4' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: driverDocError && !driverFormData.faceFileName ? '#dc2626' : '#059669' }}>🤳 Upload Face Selfie Photo (Compulsory) *</label>
                    <input type="file" required accept="image/*" onChange={e => setDriverFormData({ ...driverFormData, faceFileName: e.target.files[0]?.name || '' })} style={{ width: '100%', padding: '0.4rem', borderRadius: '8px', border: driverDocError && !driverFormData.faceFileName ? '1.5px solid #dc2626' : '1px dashed #059669', fontSize: '0.78rem', background: '#f0fdf4' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: driverDocError && !driverFormData.aadhaarFileName ? '#dc2626' : '#059669' }}>🪪 Upload Aadhaar Document (Compulsory) *</label>
                    <input type="file" required accept="image/*,.pdf" onChange={e => setDriverFormData({ ...driverFormData, aadhaarFileName: e.target.files[0]?.name || '' })} style={{ width: '100%', padding: '0.4rem', borderRadius: '8px', border: driverDocError && !driverFormData.aadhaarFileName ? '1.5px solid #dc2626' : '1px dashed #059669', fontSize: '0.78rem', background: '#f0fdf4' }} />
                  </div>
                </div>

                <button type="submit" style={{ width: '100%', background: '#059669', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '10px', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer' }}>
                  🚀 Submit Driver Profile for Super Admin Approval
                </button>
              </form>
            ) : (
              /* FORM 3: RENTAL BUSINESS REGISTRATION (MULTI-STEP) */
              <form onSubmit={e => {
                e.preventDefault();
                if (companyStep === 1) {
                  if (!companyFormData.logoFileName) {
                    setCompanyDocError('⚠️ Company Logo upload is COMPULSORY for Rental Business onboarding!');
                    return;
                  }
                  setCompanyDocError('');
                  setCompanyStep(2);
                  return;
                }
                const existing = JSON.parse(localStorage.getItem('pending_companies') || '[]');
                const newComp = { id: 'cmp_' + Date.now(), name: companyFormData.companyName, companyName: companyFormData.companyName, ownerName: companyFormData.ownerName, email: companyFormData.email, phone: companyFormData.phone, gstNo: companyFormData.gstNo, address: companyFormData.address, plan: companyFormData.plan, status: 'pending_approval', createdAt: new Date().toISOString() };
                localStorage.setItem('pending_companies', JSON.stringify([newComp, ...existing]));

                setRegSuccessNotice(`Company registration for "${companyFormData.companyName}" submitted! Status: PENDING Super Admin Approval. You will be able to log in using your registered email (${companyFormData.email}) and password once Super Admin approves your application.`);
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button type="button" onClick={() => { if (companyStep === 2) setCompanyStep(1); else setSelectedRegRole(null); setCompanyDocError(''); }} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>← Back</button>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>🏢 Register as Rental Business</h3>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#f3e8ff', color: '#7c3aed', padding: '0.25rem 0.65rem', borderRadius: '12px' }}>Step {companyStep} of 2</span>
                </div>

                {companyDocError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem' }}>
                    {companyDocError}
                  </div>
                )}

                {companyStep === 1 ? (
                  /* STEP 1: COMPANY PROFILE */
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Owner / First Name *</label>
                      <input type="text" required placeholder="e.g. Pooja S." value={companyFormData.ownerName} onChange={e => setCompanyFormData({ ...companyFormData, ownerName: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Company Name *</label>
                      <input type="text" required placeholder="e.g. Pooja Cars & Rentals" value={companyFormData.companyName} onChange={e => setCompanyFormData({ ...companyFormData, companyName: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Contact Email ID *</label>
                      <input type="email" required placeholder="pooja@poojacars.com" value={companyFormData.email} onChange={e => setCompanyFormData({ ...companyFormData, email: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Phone Number *</label>
                      <input type="text" required placeholder="+91 98421 88990" value={companyFormData.phone} onChange={e => setCompanyFormData({ ...companyFormData, phone: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>GST Number *</label>
                      <input type="text" required value={companyFormData.gstNo} onChange={e => setCompanyFormData({ ...companyFormData, gstNo: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: companyDocError && !companyFormData.logoFileName ? '#dc2626' : '#7c3aed' }}>🖼️ Company Logo File (Compulsory) *</label>
                      <input type="file" required accept="image/*" onChange={e => setCompanyFormData({ ...companyFormData, logoFileName: e.target.files[0]?.name || '' })} style={{ width: '100%', padding: '0.4rem', borderRadius: '8px', border: companyDocError && !companyFormData.logoFileName ? '1.5px solid #dc2626' : '1px dashed #7c3aed', fontSize: '0.75rem', background: '#faf5ff' }} />
                    </div>
                  </div>
                ) : (
                  /* STEP 2: ADDRESS & SECURITY */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Office / Business Address</label>
                      <textarea required rows={2} placeholder="Door No 12, Main Road, Dharmapuri..." value={companyFormData.address} onChange={e => setCompanyFormData({ ...companyFormData, address: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Account Password 🔐</label>
                        <input type="password" required placeholder="••••••••" value={companyFormData.password} onChange={e => setCompanyFormData({ ...companyFormData, password: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Onboarding Trial Plan</label>
                        <select value={companyFormData.plan} onChange={e => setCompanyFormData({ ...companyFormData, plan: e.target.value })} style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
                          <option value="14-Day Free Trial (₹0 upfront)">14-Day Free Trial (₹0 upfront)</option>
                          <option value="Pro Plan">Pro Plan (₹7,000/month + 3% comm)</option>
                          <option value="Basic Plan">Basic Plan (₹3,000/month + 5% comm)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <button type="submit" style={{ width: '100%', background: '#7c3aed', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '10px', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer' }}>
                  {companyStep === 1 ? 'Next: Address & Password →' : '🚀 Complete Business Registration (14 Days Free Trial)'}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* WELCOME TO ROYAL CAR RENTAL POPUP MODAL */}
      {showWelcomeModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            sessionStorage.setItem('royal_welcome_shown', 'true');
            setShowWelcomeModal(false);
          }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.82)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '520px', width: '94%', borderRadius: '24px',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              boxShadow: '0 30px 70px rgba(0,0,0,0.35)', border: '1px solid #e2e8f0',
              padding: '2.25rem', textAlign: 'center', position: 'relative',
              animation: 'zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <button
              onClick={() => {
                sessionStorage.setItem('royal_welcome_shown', 'true');
                setShowWelcomeModal(false);
              }}
              style={{
                position: 'absolute', top: '16px', right: '16px', border: 'none',
                background: '#f1f5f9', color: '#64748b', width: '36px', height: '36px',
                borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold'
              }}
            >
              ✕
            </button>

            <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem', filter: 'drop-shadow(0 10px 15px rgba(37,99,235,0.3))' }}>
              👑
            </div>

            <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.35rem' }}>
              PREMIUM MOBILITY PLATFORM
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
              Welcome to Royal Car Rental! 🚗
            </h2>

            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.5rem', fontWeight: 500 }}>
              Experience luxury self-drive rentals and professional chauffeur-driven cars across Tamil Nadu. Doorstep delivery, 24/7 GPS tracking, and instant verification!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  sessionStorage.setItem('royal_welcome_shown', 'true');
                  setShowWelcomeModal(false);
                  const fleetElem = document.getElementById('search-catalog-section');
                  if (fleetElem) fleetElem.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  width: '100%', padding: '0.85rem', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff',
                  border: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(37,99,235,0.35)'
                }}
              >
                🚀 Explore Available Vehicles Now
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    sessionStorage.setItem('royal_welcome_shown', 'true');
                    setShowWelcomeModal(false);
                    navigate('/auth');
                  }}
                  style={{
                    padding: '0.7rem', borderRadius: '10px', background: '#f8fafc',
                    color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: 800,
                    fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  🔑 Customer / Admin Login
                </button>
                <button
                  onClick={() => {
                    sessionStorage.setItem('royal_welcome_shown', 'true');
                    setShowWelcomeModal(false);
                    setShowMultiRoleRegModal(true);
                  }}
                  style={{
                    padding: '0.7rem', borderRadius: '10px', background: '#ecfdf5',
                    color: '#059669', border: '1px solid #a7f3d0', fontWeight: 800,
                    fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  🤝 Join as Partner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Circular + AI Trigger Button */}
      {!isAiChatbotOpen && (
        <div 
          onClick={() => setIsAiChatbotOpen(true)}
          title="Royal Rent Cars AI Concierge"
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            zIndex: 99999,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#4E311B',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(78, 49, 27, 0.5)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.165, 0.84, 0.44, 1)',
            border: '2px solid rgba(255, 255, 255, 0.25)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
      )}

      {/* AI Modals placed at root to avoid stacking context issues */}
      <AIFinderModal 
        isOpen={showAiModal} 
        onClose={() => setShowAiModal(false)} 
        onSelectVehicle={(v) => setBookingVehicle(v)}
      />

      <AIChatbot 
        isOpen={isAiChatbotOpen} 
        onClose={() => setIsAiChatbotOpen(false)} 
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ZOOMCAR & MEESHO STYLE RICH VEHICLE DETAILS MODAL
───────────────────────────────────────────────────────────────── */
function VehicleDetailsModal({ vehicle, allFleet, onSelectVehicle, onClose, onProceedBook, user, searchLocation }) {
  if (!vehicle) return null;

  // Gather all images (primary cover + galleryImages)
  const images = [];
  if (vehicle.imageUrl) images.push(vehicle.imageUrl);
  if (vehicle.galleryImages && Array.isArray(vehicle.galleryImages)) {
    vehicle.galleryImages.forEach(img => {
      if (img && !images.includes(img)) images.push(img);
    });
  }
  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=400');
  }

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [kmPackage, setKmPackage] = useState('unlimited');
  const [depositOption, setDepositOption] = useState('payLater');
  const [includeProtection, setIncludeProtection] = useState(true);
  const [bookingType, setBookingType] = useState('self-drive');

  const pricePerDay = vehicle.pricePerDay || 2000;
  const basePrice = kmPackage === '48km' ? Math.round(pricePerDay * 0.8) : pricePerDay;
  const protectionFee = includeProtection ? 189 : 0;
  const totalPrice = basePrice + protectionFee;

  const nextImg = () => setActiveImgIndex((prev) => (prev + 1) % images.length);
  const prevImg = () => setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);

  // Related cars in same city or general category
  const relatedCars = (allFleet || []).filter(c => c._id !== vehicle._id && (c.location === vehicle.location || c.category === vehicle.category)).slice(0, 6);

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '960px', width: '95%', maxHeight: '92vh', overflowY: 'auto', background: '#0b0f19', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '1.5rem', borderRadius: '16px' }}>

        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', color: '#38bdf8', border: '1px solid rgba(255,255,255,0.15)', padding: '0.4rem 0.85rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            ← Back to Catalog
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img src={vehicle.company?.logo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Company Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
              Verified Operator: <strong style={{ color: '#ffffff' }}>{vehicle.company?.name || 'DriveX Rentals'}</strong>
            </span>
            <button className="close-btn" onClick={onClose} style={{ color: '#fff', fontSize: '1.5rem' }}>×</button>
          </div>
        </div>

        {/* Host Badge Banner */}
        <div style={{ background: 'linear-gradient(90deg, rgba(217,119,6,0.15), rgba(245,158,11,0.15))', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '0.65rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontSize: '0.82rem', fontWeight: 800 }}>
            <span>🏅 Professional Host:</span>
            <span style={{ color: '#fef08a', fontWeight: 600 }}>99% fulfillment with consistent 5-star ratings</span>
          </div>
          <span style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700 }}>✓ Verified Fleet</span>
        </div>

        {/* Main Grid: Gallery Left & Pricing/Booking Right */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>

          {/* LEFT: MULTI-PHOTO GALLERY CAROUSEL */}
          <div>
            <div style={{ position: 'relative', width: '100%', height: '320px', borderRadius: '12px', overflow: 'hidden', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
              <img
                src={getValidImageUrl(images[activeImgIndex], 'vehicle')}
                onError={e => handleImageError(e, 'vehicle')}
                alt={vehicle.model}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Prev / Next Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImg}
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(15,23,42,0.85)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextImg}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(15,23,42,0.85)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ›
                  </button>
                </>
              )}

              {/* Image Counter Badge 1/N */}
              <span style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(15,23,42,0.85)', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }}>
                {activeImgIndex + 1}/{images.length}
              </span>
            </div>

            {/* Thumbnail Strip */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginTop: '0.75rem', paddingBottom: '0.3rem' }}>
              {images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImgIndex(idx)}
                  style={{
                    width: '72px', height: '50px', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer',
                    border: idx === activeImgIndex ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.15)',
                    opacity: idx === activeImgIndex ? 1 : 0.65, transition: 'all 0.2s ease', flexShrink: 0
                  }}
                >
                  <img src={getValidImageUrl(imgUrl, 'vehicle')} onError={e => handleImageError(e, 'vehicle')} alt="Thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: DETAILS & KM PACKAGE BOOKING PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: '0 0 0.35rem 0', color: '#ffffff' }}>
                {vehicle.make} {vehicle.model} {vehicle.year || 2024}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#059669', color: '#ffffff', fontSize: '0.78rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                  ★ 4.68 (21 ratings)
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {vehicle.specs?.transmission || vehicle.transmission || 'Manual'} • {vehicle.specs?.fuel || vehicle.fuelType || 'Petrol'} • {vehicle.specs?.seats || vehicle.seats || 5} Seats
                </span>
              </div>
            </div>

            {/* Published Company Logo & Verified Operator Header */}
            {(vehicle.companyName || vehicle.company?.name || vehicle.companyLogo || vehicle.company?.logo) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'rgba(255,255,255,0.04)', padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {(vehicle.companyLogo || vehicle.company?.logo) ? (
                  <img
                    src={vehicle.companyLogo || vehicle.company?.logo}
                    alt="Company Logo"
                    style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
                  />
                ) : (
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#38bdf8', color: '#0f172a', fontWeight: 900, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(vehicle.companyName || vehicle.company?.name || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  Verified Operator: <strong style={{ color: '#38bdf8' }}>{vehicle.companyName || vehicle.company?.name}</strong>
                </span>
              </div>
            )}

            {/* Rental Mode Selector: Self-Drive vs Car + Driver */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>
                Select Rental Service Type:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setBookingType && setBookingType('self-drive')}
                  style={{
                    background: bookingType !== 'with_driver' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'rgba(255,255,255,0.05)',
                    color: '#ffffff', border: bookingType !== 'with_driver' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.15)',
                    padding: '0.5rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', textAlign: 'center'
                  }}
                >
                  🏎️ Self-Drive Rental
                </button>
                <button
                  type="button"
                  onClick={() => setBookingType && setBookingType('with_driver')}
                  style={{
                    background: bookingType === 'with_driver' ? 'linear-gradient(135deg, #059669, #047857)' : 'rgba(255,255,255,0.05)',
                    color: '#ffffff', border: bookingType === 'with_driver' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.15)',
                    padding: '0.5rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', textAlign: 'center'
                  }}
                >
                  👨‍✈️ Car + Driver (+₹500/day)
                </button>
              </div>
            </div>

            {/* Price & Km Package Selector Box */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Choose your Km Package</span>
                <span style={{ fontSize: '1.1rem', color: '#10b981', fontWeight: 900 }}>₹{basePrice}/day</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', borderRadius: '8px', background: kmPackage === '48km' ? 'rgba(37,99,235,0.15)' : 'transparent', border: `1px solid ${kmPackage === '48km' ? '#2563eb' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="radio" name="km_pkg" checked={kmPackage === '48km'} onChange={() => setKmPackage('48km')} />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>48 Kms Included</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>₹9/km charged in case of excess km</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.85rem' }}>₹{Math.round(pricePerDay * 0.8)}</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', borderRadius: '8px', background: kmPackage === 'unlimited' ? 'rgba(37,99,235,0.15)' : 'transparent', border: `1px solid ${kmPackage === 'unlimited' ? '#2563eb' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="radio" name="km_pkg" checked={kmPackage === 'unlimited'} onChange={() => setKmPackage('unlimited')} />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Unlimited Kms Included</div>
                      <div style={{ fontSize: '0.7rem', color: '#34d399' }}>Drive anywhere without km limits</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.85rem' }}>₹{pricePerDay}</span>
                </label>
              </div>
            </div>

            {/* Protection Plan */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981' }}>🛡️ Travel with confidence</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Your trip is secured against accidental damage</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8' }}>
                <input type="checkbox" checked={includeProtection} onChange={e => setIncludeProtection(e.target.checked)} />
                +₹189
              </label>
            </div>

            {/* Deposit Option */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fbbf24', marginBottom: '0.5rem' }}>🛡️ Refundable Security Deposit: ₹1,000</div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                  <input type="radio" name="dep_opt" checked={depositOption === 'payNow'} onChange={() => setDepositOption('payNow')} /> Pay Now
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                  <input type="radio" name="dep_opt" checked={depositOption === 'payLater'} onChange={() => setDepositOption('payLater')} /> Pay Later (Before Trip)
                </label>
              </div>
            </div>

            {/* Book Now Button */}
            <button
              onClick={() => onProceedBook(vehicle)}
              style={{
                width: '100%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#ffffff',
                border: 'none', padding: '0.85rem', borderRadius: '10px', fontWeight: 900,
                fontSize: '1rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(37,99,235,0.4)',
                marginTop: 'auto'
              }}
            >
              {user ? `Proceed to Book (Total: ₹${totalPrice})` : `🔐 Sign In / Renter Register to Book`}
            </button>
          </div>

        </div>

        {/* MEESHO-STYLE RELATED VEHICLES SCROLL SECTION */}
        {relatedCars.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', marginBottom: '1rem' }}>
              Explore Similar Cars in {searchLocation || vehicle.location || 'Dharmapuri'}
            </h3>

            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {relatedCars.map((rCar, idx) => (
                <div
                  key={rCar._id ? `${rCar._id}-${idx}` : `rel-${idx}`}
                  onClick={() => onSelectVehicle(rCar)}
                  style={{
                    minWidth: '220px', background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)',
                    overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s ease', flexShrink: 0
                  }}
                >
                  <img src={getValidImageUrl(rCar.imageUrl, 'vehicle')} onError={e => handleImageError(e, 'vehicle')} alt={rCar.model} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                  <div style={{ padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', marginBottom: '0.2rem' }}>{rCar.make} {rCar.model}</div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 800 }}>₹{rCar.pricePerDay}/day</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>{rCar.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}


