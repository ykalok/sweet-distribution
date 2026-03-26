const CITY_STATE: Record<string, string> = {
  // Andhra Pradesh
  visakhapatnam: 'Andhra Pradesh', vijayawada: 'Andhra Pradesh', guntur: 'Andhra Pradesh',
  nellore: 'Andhra Pradesh', kurnool: 'Andhra Pradesh', tirupati: 'Andhra Pradesh',
  rajahmundry: 'Andhra Pradesh', kakinada: 'Andhra Pradesh', anantapur: 'Andhra Pradesh',
  // Assam
  guwahati: 'Assam', dibrugarh: 'Assam', silchar: 'Assam', jorhat: 'Assam',
  // Bihar
  patna: 'Bihar', gaya: 'Bihar', bhagalpur: 'Bihar', muzaffarpur: 'Bihar', darbhanga: 'Bihar',
  // Chhattisgarh
  raipur: 'Chhattisgarh', bhilai: 'Chhattisgarh', bilaspur: 'Chhattisgarh', durg: 'Chhattisgarh',
  // Delhi
  delhi: 'Delhi', 'new delhi': 'Delhi', dwarka: 'Delhi', rohini: 'Delhi', janakpuri: 'Delhi',
  // Goa
  panaji: 'Goa', margao: 'Goa', vasco: 'Goa',
  // Gujarat
  ahmedabad: 'Gujarat', surat: 'Gujarat', vadodara: 'Gujarat', rajkot: 'Gujarat',
  bhavnagar: 'Gujarat', jamnagar: 'Gujarat', gandhinagar: 'Gujarat', anand: 'Gujarat',
  // Haryana
  faridabad: 'Haryana', gurgaon: 'Haryana', gurugram: 'Haryana', panipat: 'Haryana',
  ambala: 'Haryana', hisar: 'Haryana', rohtak: 'Haryana', karnal: 'Haryana',
  // Himachal Pradesh
  shimla: 'Himachal Pradesh', manali: 'Himachal Pradesh', dharamshala: 'Himachal Pradesh',
  // Jharkhand
  ranchi: 'Jharkhand', jamshedpur: 'Jharkhand', dhanbad: 'Jharkhand', bokaro: 'Jharkhand',
  // Karnataka
  bangalore: 'Karnataka', bengaluru: 'Karnataka', mysore: 'Karnataka', mysuru: 'Karnataka',
  hubli: 'Karnataka', mangalore: 'Karnataka', belgaum: 'Karnataka', davangere: 'Karnataka',
  bellary: 'Karnataka', gulbarga: 'Karnataka', shimoga: 'Karnataka', tumkur: 'Karnataka',
  // Kerala
  thiruvananthapuram: 'Kerala', kochi: 'Kerala', kozhikode: 'Kerala', thrissur: 'Kerala',
  kollam: 'Kerala', kannur: 'Kerala', alappuzha: 'Kerala', palakkad: 'Kerala',
  // Madhya Pradesh
  bhopal: 'Madhya Pradesh', indore: 'Madhya Pradesh', jabalpur: 'Madhya Pradesh',
  gwalior: 'Madhya Pradesh', ujjain: 'Madhya Pradesh', sagar: 'Madhya Pradesh',
  // Maharashtra
  mumbai: 'Maharashtra', pune: 'Maharashtra', nagpur: 'Maharashtra', nashik: 'Maharashtra',
  aurangabad: 'Maharashtra', solapur: 'Maharashtra', thane: 'Maharashtra', kolhapur: 'Maharashtra',
  'navi mumbai': 'Maharashtra', amravati: 'Maharashtra', akola: 'Maharashtra', latur: 'Maharashtra',
  // Manipur
  imphal: 'Manipur',
  // Meghalaya
  shillong: 'Meghalaya',
  // Odisha
  bhubaneswar: 'Odisha', cuttack: 'Odisha', rourkela: 'Odisha', berhampur: 'Odisha',
  // Punjab
  ludhiana: 'Punjab', amritsar: 'Punjab', jalandhar: 'Punjab', patiala: 'Punjab',
  bathinda: 'Punjab', mohali: 'Punjab',
  // Rajasthan
  jaipur: 'Rajasthan', jodhpur: 'Rajasthan', udaipur: 'Rajasthan', kota: 'Rajasthan',
  ajmer: 'Rajasthan', bikaner: 'Rajasthan', alwar: 'Rajasthan', bharatpur: 'Rajasthan',
  // Tamil Nadu
  chennai: 'Tamil Nadu', coimbatore: 'Tamil Nadu', madurai: 'Tamil Nadu', tiruchirappalli: 'Tamil Nadu',
  salem: 'Tamil Nadu', tirunelveli: 'Tamil Nadu', vellore: 'Tamil Nadu', erode: 'Tamil Nadu',
  tiruppur: 'Tamil Nadu',
  // Telangana
  hyderabad: 'Telangana', warangal: 'Telangana', nizamabad: 'Telangana', karimnagar: 'Telangana',
  secunderabad: 'Telangana',
  // Uttar Pradesh
  lucknow: 'Uttar Pradesh', kanpur: 'Uttar Pradesh', agra: 'Uttar Pradesh', varanasi: 'Uttar Pradesh',
  allahabad: 'Uttar Pradesh', prayagraj: 'Uttar Pradesh', meerut: 'Uttar Pradesh',
  ghaziabad: 'Uttar Pradesh', noida: 'Uttar Pradesh', bareilly: 'Uttar Pradesh',
  aligarh: 'Uttar Pradesh', moradabad: 'Uttar Pradesh', gorakhpur: 'Uttar Pradesh',
  mathura: 'Uttar Pradesh', firozabad: 'Uttar Pradesh',
  // Uttarakhand
  dehradun: 'Uttarakhand', haridwar: 'Uttarakhand', roorkee: 'Uttarakhand', nainital: 'Uttarakhand',
  // West Bengal
  kolkata: 'West Bengal', howrah: 'West Bengal', durgapur: 'West Bengal', asansol: 'West Bengal',
  siliguri: 'West Bengal', bardhaman: 'West Bengal',
  // Chandigarh
  chandigarh: 'Chandigarh',
  // Jammu & Kashmir
  srinagar: 'Jammu & Kashmir', jammu: 'Jammu & Kashmir',
};

export const getStateByCity = (city: string): string => {
  return CITY_STATE[city.trim().toLowerCase()] || '';
};
