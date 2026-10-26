export const FESTIVAL_ID = 'UNIFEST_2026';

export const COLLEGE_PALETTE = [
  { code: 'PCE', color: '#2563EB', bg: 'bg-blue-600', text: 'text-blue-100', border: 'border-blue-500' },
  { code: 'LPU', color: '#7C3AED', bg: 'bg-purple-600', text: 'text-purple-100', border: 'border-purple-500' },
  { code: 'IITD', color: '#059669', bg: 'bg-emerald-600', text: 'text-emerald-100', border: 'border-emerald-500' },
  { code: 'DU', color: '#D97706', bg: 'bg-amber-600', text: 'text-amber-100', border: 'border-amber-500' },
  { code: 'BITS', color: '#DC2626', bg: 'bg-rose-600', text: 'text-rose-100', border: 'border-rose-500' },
  { code: 'DTU', color: '#0891B2', bg: 'bg-cyan-600', text: 'text-cyan-100', border: 'border-cyan-500' },
  { code: 'TIET', color: '#4F46E5', bg: 'bg-indigo-600', text: 'text-indigo-100', border: 'border-indigo-500' },
  { code: 'PEC', color: '#EA580C', bg: 'bg-orange-600', text: 'text-orange-100', border: 'border-orange-500' },
];

export const ERROR_MESSAGES = {
  QR_INVALID: 'Invalid or forged QR token.',
  QR_EXPIRED: 'QR token has expired or is revoked.',
  NO_ALLOCATION: 'No hostel room allocated yet. Please visit the help desk.',
  ALREADY_CHECKED_IN: 'Student is already checked in.',
  NOT_CHECKED_IN: 'Student is not checked in. Cannot check out.',
  MEAL_ALREADY_USED: 'Meal already redeemed for this slot.',
  MEAL_WRONG_BATCH: 'Current time is outside your assigned college/gender batch window.',
  MEAL_OUTSIDE_WINDOW: 'Meal mess is currently closed for this slot.',
  ALLOCATION_RULE_VIOLATION: 'Move violates safety constraints (mixed gender, mixed college, or capacity exceeded).',
  CAPACITY_EXCEEDED: 'Room capacity reached.',
  UNAUTHORIZED: 'You do not have permission for this action.',
};

export interface NorthIndiaCollegeItem {
  id: string;
  name: string;
  shortName: string;
  region: 'Punjab & Chandigarh' | 'Delhi NCR' | 'Haryana' | 'HP, Uttarakhand & J&K' | 'Uttar Pradesh' | 'Rajasthan' | 'Other';
}

export const NORTH_INDIA_COLLEGES: NorthIndiaCollegeItem[] = [
  // ── Punjab & Chandigarh ──
  { id: 'col-cgc-univ-mohali', name: 'CGC University, Mohali', shortName: 'CGC University Mohali', region: 'Punjab & Chandigarh' },
  { id: 'col-cgc-jhanjeri', name: 'Chandigarh Group of Colleges (CGC) Jhanjeri, Mohali', shortName: 'CGC Jhanjeri', region: 'Punjab & Chandigarh' },
  { id: 'col-cgc-landran', name: 'Chandigarh Group of Colleges (CGC) Landran, Mohali', shortName: 'CGC Landran', region: 'Punjab & Chandigarh' },
  { id: 'col-cu', name: 'Chandigarh University (CU), Gharuan / Mohali', shortName: 'CU Mohali', region: 'Punjab & Chandigarh' },
  { id: 'col-chitkara', name: 'Chitkara University, Rajpura / Punjab', shortName: 'Chitkara Univ', region: 'Punjab & Chandigarh' },
  { id: 'col-tiet', name: 'Thapar Institute of Engineering & Technology (TIET), Patiala', shortName: 'Thapar / TIET', region: 'Punjab & Chandigarh' },
  { id: 'col-pec', name: 'Punjab Engineering College (PEC), Chandigarh', shortName: 'PEC Chandigarh', region: 'Punjab & Chandigarh' },
  { id: 'col-pu', name: 'Panjab University (PU), Chandigarh', shortName: 'Panjab Univ', region: 'Punjab & Chandigarh' },
  { id: 'col-lpu', name: 'Lovely Professional University (LPU), Phagwara / Jalandhar', shortName: 'LPU', region: 'Punjab & Chandigarh' },
  { id: 'col-nitj', name: 'Dr. B. R. Ambedkar National Institute of Technology (NIT Jalandhar)', shortName: 'NIT Jalandhar', region: 'Punjab & Chandigarh' },
  { id: 'col-iitrpr', name: 'Indian Institute of Technology Ropar (IIT Ropar)', shortName: 'IIT Ropar', region: 'Punjab & Chandigarh' },
  { id: 'col-gndu', name: 'Guru Nanak Dev University (GNDU), Amritsar', shortName: 'GNDU', region: 'Punjab & Chandigarh' },
  { id: 'col-punjabi-u', name: 'Punjabi University, Patiala', shortName: 'Punjabi Univ', region: 'Punjab & Chandigarh' },
  { id: 'col-rayat-bahra', name: 'Rayat Bahra University, Mohali', shortName: 'Rayat Bahra', region: 'Punjab & Chandigarh' },
  { id: 'col-dav-jalandhar', name: 'DAV University, Jalandhar', shortName: 'DAV Jalandhar', region: 'Punjab & Chandigarh' },
  { id: 'col-sliet', name: 'Sant Longowal Institute of Engineering & Technology (SLIET), Sangrur', shortName: 'SLIET', region: 'Punjab & Chandigarh' },
  { id: 'col-gna', name: 'GNA University, Phagwara', shortName: 'GNA Univ', region: 'Punjab & Chandigarh' },
  { id: 'col-desh-bhagat', name: 'Desh Bhagat University, Mandi Gobindgarh', shortName: 'Desh Bhagat', region: 'Punjab & Chandigarh' },
  { id: 'col-ct-univ', name: 'CT University, Ludhiana / Jalandhar', shortName: 'CT Univ', region: 'Punjab & Chandigarh' },
  { id: 'col-rimt', name: 'RIMT University, Mandi Gobindgarh', shortName: 'RIMT', region: 'Punjab & Chandigarh' },
  { id: 'col-ikgptu', name: 'I.K. Gujral Punjab Technical University (IKGPTU), Kapurthala', shortName: 'IKGPTU', region: 'Punjab & Chandigarh' },
  { id: 'col-pce', name: 'Punjab College of Engineering (PCE)', shortName: 'PCE', region: 'Punjab & Chandigarh' },

  // ── Delhi NCR ──
  { id: 'col-iitd', name: 'Indian Institute of Technology Delhi (IIT Delhi)', shortName: 'IIT Delhi', region: 'Delhi NCR' },
  { id: 'col-dtu', name: 'Delhi Technological University (DTU / DCE), New Delhi', shortName: 'DTU', region: 'Delhi NCR' },
  { id: 'col-nsut', name: 'Netaji Subhas University of Technology (NSUT), New Delhi', shortName: 'NSUT', region: 'Delhi NCR' },
  { id: 'col-iiitd', name: 'Indraprastha Institute of Information Technology (IIIT Delhi)', shortName: 'IIIT Delhi', region: 'Delhi NCR' },
  { id: 'col-du', name: 'University of Delhi (DU - North / South Campus)', shortName: 'Delhi University', region: 'Delhi NCR' },
  { id: 'col-jmi', name: 'Jamia Millia Islamia (JMI), New Delhi', shortName: 'JMI New Delhi', region: 'Delhi NCR' },
  { id: 'col-jnu', name: 'Jawaharlal Nehru University (JNU), New Delhi', shortName: 'JNU New Delhi', region: 'Delhi NCR' },
  { id: 'col-ggsipu', name: 'Guru Gobind Singh Indraprastha University (GGSIPU / IPU)', shortName: 'GGSIPU / IPU', region: 'Delhi NCR' },
  { id: 'col-igdtuw', name: 'Indira Gandhi Delhi Technical University for Women (IGDTUW)', shortName: 'IGDTUW', region: 'Delhi NCR' },
  { id: 'col-amity-noida', name: 'Amity University, Noida', shortName: 'Amity Noida', region: 'Delhi NCR' },
  { id: 'col-sharda', name: 'Sharda University, Greater Noida', shortName: 'Sharda Univ', region: 'Delhi NCR' },
  { id: 'col-galgotias', name: 'Galgotias University / College of Engineering, Greater Noida', shortName: 'Galgotias', region: 'Delhi NCR' },
  { id: 'col-snu', name: 'Shiv Nadar University (SNU), Greater Noida', shortName: 'Shiv Nadar Univ', region: 'Delhi NCR' },
  { id: 'col-bennett', name: 'Bennett University (Times Group), Greater Noida', shortName: 'Bennett Univ', region: 'Delhi NCR' },
  { id: 'col-jiit', name: 'Jaypee Institute of Information Technology (JIIT), Noida', shortName: 'JIIT Noida', region: 'Delhi NCR' },
  { id: 'col-akgec', name: 'Ajay Kumar Garg Engineering College (AKGEC), Ghaziabad', shortName: 'AKGEC', region: 'Delhi NCR' },
  { id: 'col-kiet', name: 'KIET Group of Institutions, Ghaziabad', shortName: 'KIET', region: 'Delhi NCR' },
  { id: 'col-jss-noida', name: 'JSS Academy of Technical Education, Noida', shortName: 'JSS Noida', region: 'Delhi NCR' },
  { id: 'col-abes', name: 'ABES Engineering College, Ghaziabad', shortName: 'ABES', region: 'Delhi NCR' },
  { id: 'col-srm-ncr', name: 'SRM Institute of Science and Technology, NCR Campus, Modinagar', shortName: 'SRM NCR', region: 'Delhi NCR' },

  // ── Haryana ──
  { id: 'col-nitkkr', name: 'National Institute of Technology Kurukshetra (NIT Kurukshetra)', shortName: 'NIT Kurukshetra', region: 'Haryana' },
  { id: 'col-ymca', name: 'J.C. Bose University of Science and Technology (YMCA), Faridabad', shortName: 'YMCA Faridabad', region: 'Haryana' },
  { id: 'col-ashoka', name: 'Ashoka University, Rajiv Gandhi Education City, Sonipat', shortName: 'Ashoka Univ', region: 'Haryana' },
  { id: 'col-jgu', name: 'O.P. Jindal Global University (JGU), Sonipat', shortName: 'Jindal Global', region: 'Haryana' },
  { id: 'col-bml', name: 'BML Munjal University, Gurugram', shortName: 'BML Munjal', region: 'Haryana' },
  { id: 'col-ncu', name: 'The NorthCap University (NCU), Gurugram', shortName: 'NorthCap Univ', region: 'Haryana' },
  { id: 'col-mdu', name: 'Maharshi Dayanand University (MDU), Rohtak', shortName: 'MDU Rohtak', region: 'Haryana' },
  { id: 'col-ku', name: 'Kurukshetra University, Kurukshetra', shortName: 'Kurukshetra Univ', region: 'Haryana' },
  { id: 'col-dcrust', name: 'Deenbandhu Chhotu Ram University of Science & Tech (DCRUST), Murthal', shortName: 'DCRUST Murthal', region: 'Haryana' },
  { id: 'col-manav-rachna', name: 'Manav Rachna International Institute of Research & Studies, Faridabad', shortName: 'Manav Rachna', region: 'Haryana' },
  { id: 'col-krmangalam', name: 'K.R. Mangalam University, Gurugram', shortName: 'KR Mangalam', region: 'Haryana' },
  { id: 'col-gurugram-u', name: 'Gurugram University, Gurugram', shortName: 'Gurugram Univ', region: 'Haryana' },
  { id: 'col-cuh', name: 'Central University of Haryana, Mahendragarh', shortName: 'CU Haryana', region: 'Haryana' },

  // ── Himachal Pradesh, Uttarakhand & J&K ──
  { id: 'col-iit-mandi', name: 'Indian Institute of Technology Mandi (IIT Mandi)', shortName: 'IIT Mandi', region: 'HP, Uttarakhand & J&K' },
  { id: 'col-nith', name: 'National Institute of Technology Hamirpur (NIT Hamirpur)', shortName: 'NIT Hamirpur', region: 'HP, Uttarakhand & J&K' },
  { id: 'col-juit', name: 'Jaypee University of Information Technology (JUIT), Waknaghat', shortName: 'JUIT Waknaghat', region: 'HP, Uttarakhand & J&K' },
  { id: 'col-hpu', name: 'Himachal Pradesh University (HPU), Shimla', shortName: 'HPU Shimla', region: 'HP, Uttarakhand & J&K' },
  { id: 'col-shoolini', name: 'Shoolini University, Solan', shortName: 'Shoolini Univ', region: 'HP, Uttarakhand & J&K' },
  { id: 'col-iitr', name: 'Indian Institute of Technology Roorkee (IIT Roorkee)', shortName: 'IIT Roorkee', region: 'HP, Uttarakhand & J&K' },
  { id: 'col-nituk', name: 'National Institute of Technology Uttarakhand (NIT UK)', shortName: 'NIT Uttarakhand', region: 'HP, Uttarakhand & J&K' },
  { id: 'col-geu', name: 'Graphic Era (Deemed to be University), Dehradun', shortName: 'Graphic Era', region: 'HP, Uttarakhand & J&K' },
  { id: 'col-upes', name: 'University of Petroleum and Energy Studies (UPES), Dehradun', shortName: 'UPES Dehradun', region: 'HP, Uttarakhand & J&K' },
  { id: 'col-dit', name: 'DIT University, Dehradun', shortName: 'DIT Dehradun', region: 'HP, Uttarakhand & J&K' },
  { id: 'col-gbpuat', name: 'G.B. Pant University of Agriculture and Technology, Pantnagar', shortName: 'GBPUAT Pantnagar', region: 'HP, Uttarakhand & J&K' },
  { id: 'col-iit-jammu', name: 'Indian Institute of Technology Jammu (IIT Jammu)', shortName: 'IIT Jammu', region: 'HP, Uttarakhand & J&K' },
  { id: 'col-nitsri', name: 'National Institute of Technology Srinagar (NIT Srinagar)', shortName: 'NIT Srinagar', region: 'HP, Uttarakhand & J&K' },
  { id: 'col-smvdu', name: 'Shri Mata Vaishno Devi University (SMVDU), Katra', shortName: 'SMVDU Katra', region: 'HP, Uttarakhand & J&K' },
  { id: 'col-ju', name: 'University of Jammu, Jammu', shortName: 'Univ of Jammu', region: 'HP, Uttarakhand & J&K' },
  { id: 'col-ku-sri', name: 'University of Kashmir, Srinagar', shortName: 'Univ of Kashmir', region: 'HP, Uttarakhand & J&K' },

  // ── Uttar Pradesh ──
  { id: 'col-iitk', name: 'Indian Institute of Technology Kanpur (IIT Kanpur)', shortName: 'IIT Kanpur', region: 'Uttar Pradesh' },
  { id: 'col-iitbhu', name: 'Indian Institute of Technology (BHU) Varanasi', shortName: 'IIT BHU', region: 'Uttar Pradesh' },
  { id: 'col-mnnit', name: 'Motilal Nehru National Institute of Technology (MNNIT Allahabad)', shortName: 'MNNIT Allahabad', region: 'Uttar Pradesh' },
  { id: 'col-amu', name: 'Aligarh Muslim University (AMU), Aligarh', shortName: 'AMU Aligarh', region: 'Uttar Pradesh' },
  { id: 'col-bhu', name: 'Banaras Hindu University (BHU), Varanasi', shortName: 'BHU Varanasi', region: 'Uttar Pradesh' },
  { id: 'col-aktu', name: 'Dr. A.P.J. Abdul Kalam Technical University (AKTU / UPTU)', shortName: 'AKTU Lucknow', region: 'Uttar Pradesh' },
  { id: 'col-hbtu', name: 'Harcourt Butler Technical University (HBTU), Kanpur', shortName: 'HBTU Kanpur', region: 'Uttar Pradesh' },
  { id: 'col-mmmut', name: 'Madan Mohan Malaviya University of Technology (MMMUT), Gorakhpur', shortName: 'MMMUT Gorakhpur', region: 'Uttar Pradesh' },
  { id: 'col-iiita', name: 'Indian Institute of Information Technology Allahabad (IIIT Allahabad)', shortName: 'IIIT Allahabad', region: 'Uttar Pradesh' },
  { id: 'col-iiitl', name: 'Indian Institute of Information Technology Lucknow (IIIT Lucknow)', shortName: 'IIIT Lucknow', region: 'Uttar Pradesh' },

  // ── Rajasthan ──
  { id: 'col-bits', name: 'Birla Institute of Technology and Science (BITS Pilani)', shortName: 'BITS Pilani', region: 'Rajasthan' },
  { id: 'col-mnitj', name: 'Malaviya National Institute of Technology (MNIT Jaipur)', shortName: 'MNIT Jaipur', region: 'Rajasthan' },
  { id: 'col-iitj', name: 'Indian Institute of Technology Jodhpur (IIT Jodhpur)', shortName: 'IIT Jodhpur', region: 'Rajasthan' },
  { id: 'col-muj', name: 'Manipal University Jaipur (MUJ)', shortName: 'Manipal Jaipur', region: 'Rajasthan' },
  { id: 'col-lnmiit', name: 'The LNM Institute of Information Technology (LNMIIT), Jaipur', shortName: 'LNMIIT Jaipur', region: 'Rajasthan' },
  { id: 'col-banasthali', name: 'Banasthali Vidyapith, Tonk / Jaipur', shortName: 'Banasthali', region: 'Rajasthan' },
  { id: 'col-poornima', name: 'Poornima University / College of Engineering, Jaipur', shortName: 'Poornima Jaipur', region: 'Rajasthan' },
  { id: 'col-jecrc', name: 'JECRC University / Foundation, Jaipur', shortName: 'JECRC Jaipur', region: 'Rajasthan' },
  { id: 'col-amity-jaipur', name: 'Amity University Rajasthan, Jaipur', shortName: 'Amity Jaipur', region: 'Rajasthan' },
  { id: 'col-rtu', name: 'Rajasthan Technical University (RTU), Kota', shortName: 'RTU Kota', region: 'Rajasthan' },

  // ── Other ──
  { id: 'col-other', name: 'Other College / University (Not Listed)', shortName: 'Other College', region: 'Other' },
];
