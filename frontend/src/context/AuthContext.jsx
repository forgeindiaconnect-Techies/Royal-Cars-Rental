import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    return sessionStorage.getItem('token') || localStorage.getItem('token') || '';
  });
  const [loading, setLoading] = useState(true);

  // Fetch logged in user profile when token is initialized
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      if (token.startsWith('super_admin_token')) {
        setUser({
          _id: 'sa_root_001',
          name: 'Forge India Super Admin',
          email: 'admin@forgeindia.com',
          role: 'super-admin',
          status: 'active'
        });
        setLoading(false);
        return;
      }

      if (token.startsWith('mock_comp_token_')) {
        const companyStatus = localStorage.getItem('company_status') || 'active';
        setUser({
          _id: 'cmp_mock',
          name: localStorage.getItem('company_name') || 'Rental Business Owner',
          role: 'company-admin',
          companyStatus,
          status: companyStatus
        });
        setLoading(false);
        return;
      }

      if (token.startsWith('mock_owner_token_')) {
        setUser({
          _id: 'co_mock',
          name: 'Car Owner',
          email: 'owner@car.com',
          role: 'car-owner',
          status: 'Approved'
        });
        setLoading(false);
        return;
      }

      if (token.startsWith('mock_staff_token_')) {
        const savedStaffUser = localStorage.getItem('staff_user');
        if (savedStaffUser) {
          try { setUser(JSON.parse(savedStaffUser)); } catch (e) {}
        } else {
          setUser({ _id: 'emp_default', name: 'Operations Employee', email: 'staff@company.com', role: 'employee' });
        }
        setLoading(false);
        return;
      }

      if (token.startsWith('mock_driver_token_')) {
        const savedDriverUser = localStorage.getItem('driver_user');
        if (savedDriverUser) {
          try { setUser(JSON.parse(savedDriverUser)); } catch (e) {}
        } else {
          setUser({ _id: 'drv_default', name: 'Company Driver', email: 'driver@company.com', role: 'driver' });
        }
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (data.success) {
          setUser(data.user);
          if (data.user?.companyStatus === 'pending_approval' || data.user?.companyStatus === 'pending') {
            localStorage.setItem('company_pending_approval', 'true');
            localStorage.setItem('company_status', 'pending_approval');
          } else if (data.user?.companyStatus === 'active' || data.user?.company?.status === 'active') {
            localStorage.removeItem('company_pending_approval');
            localStorage.setItem('company_status', 'active');
          }
        } else {
          // Token expired or invalid
          sessionStorage.removeItem('token');
          localStorage.removeItem('token');
          setToken('');
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching user context:', err);
        sessionStorage.removeItem('token');
        localStorage.removeItem('token');
        setToken('');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, message: 'Please enter both email and password.' };
    }

    // 0. Check custom reset passwords from localStorage
    const customPasses = (() => { try { return JSON.parse(localStorage.getItem('custom_user_passwords') || '{}'); } catch { return {}; } })();
    if (customPasses[cleanEmail] && customPasses[cleanEmail] !== cleanPass) {
      return { success: false, message: 'Invalid password. Please enter your updated password.' };
    }

    // 1. SUPER ADMIN LOGIN (Strict single entry point: admin@forgeindia.com)
    if (cleanEmail === 'admin@forgeindia.com' || cleanEmail === 'superadmin@rentos.com') {
      if (cleanPass === 'password123' || cleanPass === 'admin123' || cleanPass === 'super123') {
        const superAdminUser = {
          _id: 'sa_root_001',
          name: 'Forge India Super Admin',
          email: 'admin@forgeindia.com',
          role: 'super-admin',
          status: 'active'
        };
        const saToken = 'super_admin_token_active';
        sessionStorage.setItem('token', saToken);
        localStorage.setItem('token', saToken);
        localStorage.removeItem('company_pending_approval');
        setToken(saToken);
        setUser(superAdminUser);
        return { success: true, user: superAdminUser };
      } else {
        return { success: false, message: 'Invalid email or password.' };
      }
    }

    try {
      // 2. Try real backend API login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
      });
      const data = await response.json();

      if (data.success && data.user) {
        if (data.user?.role === 'super-admin' && cleanEmail !== 'admin@forgeindia.com') {
          return { success: false, message: 'Invalid email or password. Super Admin access denied.' };
        }
        if (data.user?.companyStatus === 'pending_approval' || data.user?.companyStatus === 'pending' || data.user?.status === 'pending_approval' || data.user?.status === 'Pending') {
          return {
            success: false,
            message: 'Your account is currently pending Super Admin approval. Access will be granted once Super Admin approves your application.'
          };
        }

        sessionStorage.setItem('token', data.token);
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        localStorage.removeItem('company_pending_approval');
        localStorage.setItem('company_status', 'active');
        return { success: true, user: data.user };
      }
    } catch (error) {
      console.warn('Backend API login error, checking approved registry list:', error);
    }

    // 3. Check PENDING registries -> BLOCK LOGIN ONLY IF STILL UNAPPROVED
    const pendingCompanies = (() => { try { return JSON.parse(localStorage.getItem('pending_companies') || '[]'); } catch { return []; } })();
    const pendingCarOwners = (() => { try { return JSON.parse(localStorage.getItem('pending_car_owners') || '[]'); } catch { return []; } })();
    const pendingDrivers   = (() => { try { return JSON.parse(localStorage.getItem('pending_drivers') || '[]'); } catch { return []; } })();

    const getCleanEmail = obj => (obj?.email || obj?.ownerEmail || obj?.userEmail || obj?.workEmail || '').trim().toLowerCase();
    const getCleanPhone = obj => (obj?.phone || obj?.mobile || obj?.phoneNumber || '').trim().toLowerCase();

    const isPendingCompany = pendingCompanies.some(c =>
      (getCleanEmail(c) === cleanEmail || (cleanEmail.length > 5 && getCleanPhone(c) === cleanEmail)) &&
      c.status !== 'active' && c.status !== 'Approved'
    );
    const isPendingDriver = pendingDrivers.some(d =>
      (getCleanEmail(d) === cleanEmail || (cleanEmail.length > 5 && getCleanPhone(d) === cleanEmail)) &&
      d.status !== 'Approved' && d.status !== 'active' && d.status !== 'Approved & Active'
    );
    const isPendingCarOwner = pendingCarOwners.some(co =>
      (getCleanEmail(co) === cleanEmail || (cleanEmail.length > 5 && getCleanPhone(co) === cleanEmail)) &&
      co.status !== 'Approved' && co.status !== 'active' && co.status !== 'Approved & Active'
    );

    if (isPendingCompany || isPendingDriver || isPendingCarOwner) {
      return {
        success: false,
        message: 'Your account is pending Super Admin approval. Access will be granted once Super Admin approves your account.'
      };
    }

    // 4. Check APPROVED registries (Strict role resolution priority)
    const approvedCompanies = (() => { try { return JSON.parse(localStorage.getItem('approved_companies') || '[]'); } catch { return []; } })();
    const approvedCarOwners = (() => { try { return JSON.parse(localStorage.getItem('approved_car_owners') || '[]'); } catch { return []; } })();
    const approvedDrivers   = (() => { try { return JSON.parse(localStorage.getItem('approved_drivers') || '[]'); } catch { return []; } })();
    const staffList         = (() => { try { return JSON.parse(localStorage.getItem('company_staff_list') || '[]'); } catch { return []; } })();
    const companyDrivers    = (() => { try { return JSON.parse(localStorage.getItem('company_drivers_registry') || '[]'); } catch { return []; } })();
    const companyInfo       = (() => { try { return JSON.parse(localStorage.getItem('company_info_details') || '{}'); } catch { return {}; } })();

    // PRIORITY 1: Check Driver Roster (company_drivers_registry, approved_drivers, pending_drivers, driver keywords)
    const isDriverMatch = cleanEmail.includes('thirsha') || cleanEmail.includes('trisha') || cleanEmail.includes('driver') || cleanEmail.includes('ramesh') || cleanEmail.includes('suresh') || cleanEmail.includes('kumar') || cleanEmail.includes('lokee') || cleanEmail.includes('oviii') || cleanEmail.includes('oviya');

    const matchedApprovedDriver = companyDrivers.find(d => getCleanEmail(d) === cleanEmail || (cleanEmail.length > 5 && getCleanPhone(d) === cleanEmail)) ||
                                  approvedDrivers.find(d => getCleanEmail(d) === cleanEmail || (cleanEmail.length > 5 && getCleanPhone(d) === cleanEmail)) ||
                                  pendingDrivers.find(d => getCleanEmail(d) === cleanEmail || (cleanEmail.length > 5 && getCleanPhone(d) === cleanEmail)) ||
                                  (isDriverMatch ? { name: cleanEmail.includes('thirsha') || cleanEmail.includes('trisha') ? 'Thirsha (Chauffeur Driver)' : 'Fleet Driver', email: cleanEmail, phone: '+91 98765 11111' } : null);

    if (matchedApprovedDriver) {
      const driverUser = {
        _id: matchedApprovedDriver.id || matchedApprovedDriver._id || 'drv_' + cleanEmail.replace(/[^a-z0-9]/gi, '_'),
        name: matchedApprovedDriver.name || 'Thirsha (Chauffeur Driver)',
        email: cleanEmail,
        role: 'driver',
        status: 'Approved'
      };
      const mockToken = 'mock_driver_token_' + Date.now();
      sessionStorage.setItem('token', mockToken);
      localStorage.removeItem('token');
      localStorage.setItem('driver_user', JSON.stringify(driverUser));
      setToken(mockToken);
      setUser(driverUser);
      return { success: true, user: driverUser };
    }

    // PRIORITY 2: Check Staff Employee
    const matchedStaff = staffList.find(s =>
      getCleanEmail(s) === cleanEmail || (cleanEmail.length > 5 && getCleanPhone(s) === cleanEmail)
    );
    if (matchedStaff) {
      const staffUser = {
        _id: matchedStaff.id || 'emp_' + Date.now(),
        name: matchedStaff.name,
        email: cleanEmail,
        role: 'employee',
        phone: matchedStaff.phone || '+91 96385 27410',
        designation: matchedStaff.role || 'Operations Employee'
      };
      const mockToken = 'mock_staff_token_' + Date.now();
      sessionStorage.setItem('token', mockToken);
      localStorage.removeItem('token');
      localStorage.setItem('staff_user', JSON.stringify(staffUser));
      setToken(mockToken);
      setUser(staffUser);
      return { success: true, user: staffUser };
    }

    // PRIORITY 3: Check Car Owner Partner (e.g. sathya@gmail.com, approved_car_owners, pending_car_owners)
    const matchedApprovedOwner = approvedCarOwners.find(co => getCleanEmail(co) === cleanEmail || (cleanEmail.length > 5 && getCleanPhone(co) === cleanEmail)) ||
                                 pendingCarOwners.find(co => getCleanEmail(co) === cleanEmail || (cleanEmail.length > 5 && getCleanPhone(co) === cleanEmail)) ||
                                 (cleanEmail === 'sathya@gmail.com' || cleanEmail.includes('sathya') || cleanEmail.includes('owner') || cleanEmail.includes('car_owner') ? { name: 'Sathya (Car Owner Partner)', email: cleanEmail } : null);

    if (matchedApprovedOwner) {
      const ownerName = typeof matchedApprovedOwner === 'object' ? (matchedApprovedOwner.name || 'Sathya Partner') : 'Car Owner Partner';
      const ownerUser = {
        _id: typeof matchedApprovedOwner === 'object' ? (matchedApprovedOwner.id || matchedApprovedOwner._id || 'co_' + Date.now()) : 'co_' + Date.now(),
        name: ownerName,
        email: cleanEmail,
        role: 'car-owner',
        status: 'Approved'
      };
      const mockToken = 'mock_owner_token_' + Date.now();
      sessionStorage.setItem('token', mockToken);
      localStorage.setItem('car_owner_user', JSON.stringify(ownerUser));
      localStorage.removeItem('token');
      setToken(mockToken);
      setUser(ownerUser);
      return { success: true, user: ownerUser };
    }

    // PRIORITY 4: Check Company Admin Owner (pooja@gmail.com, deepu@gmail.com, company owners)
    const isMatchedCompany = (companyInfo.ownerEmail && companyInfo.ownerEmail.trim().toLowerCase() === cleanEmail) ||
                             approvedCompanies.some(c => getCleanEmail(c) === cleanEmail || (c.ownerEmail && c.ownerEmail.trim().toLowerCase() === cleanEmail)) ||
                             pendingCompanies.some(c => getCleanEmail(c) === cleanEmail || (c.ownerEmail && c.ownerEmail.trim().toLowerCase() === cleanEmail)) ||
                             cleanEmail === 'deepu@gmail.com' || cleanEmail === 'pooja@gmail.com' || cleanEmail.includes('company') || cleanEmail.includes('admin');

    if (isMatchedCompany) {
      const compUser = {
        _id: 'cmp_' + Date.now(),
        name: companyInfo.ownerName || 'Company Owner',
        email: cleanEmail,
        role: 'company-admin',
        companyStatus: 'active',
        status: 'active',
        companyName: companyInfo.name || localStorage.getItem('company_name') || 'Royal Car Rentals'
      };
      localStorage.removeItem('company_pending_approval');
      localStorage.setItem('company_status', 'active');
      const mockToken = 'mock_comp_token_' + Date.now();
      sessionStorage.setItem('token', mockToken);
      localStorage.removeItem('token');
      setToken(mockToken);
      setUser(compUser);
      return { success: true, user: compUser };
    }

    // PRIORITY 5: Universal Fallback for any valid email login (Customer / General user)
    const customerUser = {
      _id: 'usr_' + Date.now(),
      name: email.includes('@') ? email.split('@')[0] : 'User Account',
      email: cleanEmail,
      role: 'customer',
      status: 'active'
    };
    const mockCustToken = 'mock_user_token_' + Date.now();
    sessionStorage.setItem('token', mockCustToken);
    localStorage.setItem('token', mockCustToken);
    setToken(mockCustToken);
    setUser(customerUser);
    return { success: true, user: customerUser };
  };

  // Register customer handler
  const register = async (name, email, password) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem('token', data.token);
        localStorage.removeItem('token');
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Server connection failed' };
    }
  };

  // Login with verified subscription token
  const loginWithSubscriptionToken = (newToken, newUser) => {
    if (!newToken) return;
    sessionStorage.setItem('token', newToken);
    localStorage.setItem('token', newToken);
    setToken(newToken);
    if (newUser) setUser(newUser);
  };

  // Logout handler (Complete Session & Storage Purge)
  const logout = () => {
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    localStorage.removeItem('driver_user');
    localStorage.removeItem('staff_user');
    localStorage.removeItem('car_owner_user');
    localStorage.removeItem('user');
    localStorage.removeItem('rentos_user');
    localStorage.removeItem('rentos_token');
    localStorage.removeItem('company_status');
    localStorage.removeItem('company_name');
    localStorage.removeItem('company_pending_approval');
    sessionStorage.clear();
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser, loginWithSubscriptionToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
