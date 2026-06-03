import { LineItem } from '../types';

export interface InvoiceTemplate {
  name: string;
  description: string;
  items: Omit<LineItem, 'id'>[];
  notes?: string;
  deliveryNote?: string;
  supplierNote?: string;
}

export const SUPPLY_TEMPLATES: InvoiceTemplate[] = [
  {
    name: 'Standard Beef Supply (Slaughterhouse)',
    description: 'Standard cuts for raw beef supply from the abbatoir.',
    items: [
      { description: 'Beef Forequarters', quantity: 2, price: 15.50 },
      { description: 'Beef Hindquarters', quantity: 2, price: 17.00 },
      { description: 'Beef Offals (Mixed)', quantity: 1, price: 5.00 },
      { description: 'Beef Hides', quantity: 1, price: 12.00 },
    ],
    supplierNote: 'Cold chain must be maintained below 5°C. PH levels verified pre-loading.'
  },
  {
    name: 'Standard Mutton Supply',
    description: 'Bulk mutton carcasses for processing.',
    items: [
      { description: 'Mutton Carcass (Whole)', quantity: 10, price: 110.00 },
      { description: 'Mutton Heads', quantity: 10, price: 8.50 },
      { description: 'Mutton Legs', quantity: 20, price: 15.00 },
    ],
    supplierNote: 'Halal certification verified. Carcasses bagged and tagged.'
  },
  {
    name: 'Kenya Meat Commission (KMC)',
    description: 'KMC Standard Supply - Beef, goat, lamb, processed meats.',
    items: [
      { description: 'Beef Carcass (Half)', quantity: 4, price: 45000 },
      { description: 'Goat Whole Carcass', quantity: 10, price: 8500 },
      { description: 'Lamb Carcass', quantity: 5, price: 9500 },
      { description: 'Corned Beef (Cans)', quantity: 24, price: 350 }
    ],
    supplierNote: 'Government parastatal supply. Standard quality inspection passed.'
  },
  {
    name: 'Quality Meat Packers (QMP)',
    description: 'Halal beef, lamb, and chicken specialist.',
    items: [
      { description: 'Halal Beef Silverside (KGs)', quantity: 50, price: 750 },
      { description: 'Halal Lamb Shoulder (KGs)', quantity: 30, price: 900 },
      { description: 'Whole Chicken (Halal)', quantity: 100, price: 650 }
    ],
    supplierNote: 'Halal certificate attached. Slaughtered at QMP Athi River.'
  },
  {
    name: 'Farmer\'s Choice',
    description: 'Pork, sausages, bacon, ham, and beef products.',
    items: [
      { description: 'Pork Carcass (Whole)', quantity: 5, price: 28000 },
      { description: 'Standard Beef Sausages (Packs)', quantity: 100, price: 450 },
      { description: 'Back Bacon (KGs)', quantity: 20, price: 1200 },
      { description: 'Ham Sliced (KGs)', quantity: 15, price: 1500 }
    ],
    supplierNote: 'Cold supply chain managed by Farmer\'s Choice logistics.'
  },
  {
    name: 'Choice Meats',
    description: 'Halal beef, mutton, and goat meat.',
    items: [
      { description: 'Choice Halal Beef Fillet', quantity: 20, price: 1100 },
      { description: 'Mutton Whole (KGs)', quantity: 40, price: 800 },
      { description: 'Goat Legs (KGs)', quantity: 30, price: 850 }
    ],
    supplierNote: 'Premium Halal selection. Daily fresh slaughter.'
  },
  {
    name: 'East Meat Supplies Limited',
    description: 'Beef, goat, lamb, and indigenous chicken.',
    items: [
      { description: 'Indigenous Chicken (Whole)', quantity: 50, price: 1200 },
      { description: 'Beef Rump Steak (KGs)', quantity: 25, price: 850 },
      { description: 'Lamb Chops (KGs)', quantity: 20, price: 1100 }
    ],
    supplierNote: 'Ethically sourced indigenous livestock specialists.'
  },
  {
    name: 'Juja International Abattoir',
    description: 'Beef, goat, sheep, and camel meat.',
    items: [
      { description: 'Camel Meat (KGs)', quantity: 50, price: 700 },
      { description: 'Beef Striploin (KGs)', quantity: 30, price: 950 },
      { description: 'Goat Ribs (KGs)', quantity: 40, price: 750 }
    ],
    supplierNote: 'Large-scale abattoir supply. Export quality standards.'
  },
  {
    name: 'Neema Livestock & Slaughtering',
    description: 'Halal beef, goat, and sheep meat.',
    items: [
      { description: 'Halal Beef T-Bone (KGs)', quantity: 40, price: 850 },
      { description: 'Goat Shoulder (KGs)', quantity: 35, price: 800 },
      { description: 'Sheep Whole Carcass', quantity: 8, price: 9000 }
    ],
    supplierNote: 'Lucky Summer slaughterhouse operation. ISO certified.'
  },
  {
    name: 'Kenya Meat Processors Ltd',
    description: 'Beef, goat, lamb, and chicken products.',
    items: [
      { description: 'Beef Chuck (KGs)', quantity: 50, price: 780 },
      { description: 'Goat Diced (KGs)', quantity: 20, price: 900 },
      { description: 'Chicken Drumsticks (KGs)', quantity: 30, price: 450 }
    ],
    supplierNote: 'HACCP certified processing plant. Cold storage verified.'
  },
  {
    name: 'Top Meat Slaughter House',
    description: 'Beef, pork, and goat meat specialists.',
    items: [
      { description: 'Beef Brisket (KGs)', quantity: 45, price: 700 },
      { description: 'Pork Chops (KGs)', quantity: 30, price: 850 },
      { description: 'Goat Liver (KGs)', quantity: 15, price: 600 }
    ],
    supplierNote: 'Daily supply to Dagoretti market and environs.'
  }
];

export const DELIVERY_TEMPLATES: InvoiceTemplate[] = [
  {
    name: 'Bistro Weekly Delivery',
    description: 'Common cuts for small bistro/restaurant delivery.',
    items: [
      { description: 'Ribeye Steak (KGs)', quantity: 25, price: 22.00 },
      { description: 'Beef Minced (KGs)', quantity: 50, price: 8.50 },
      { description: 'Mutton Chops (KGs)', quantity: 15, price: 18.00 },
    ],
    deliveryNote: 'Delivery via refrigerated van V-01. Customer requested drop-off at back fridge.'
  },
  {
    name: 'Hotel Bulk Delivery',
    description: 'Large scale supply for hospitality sector.',
    items: [
      { description: 'Tenderloin Whole (KGs)', quantity: 40, price: 35.00 },
      { description: 'Lamb Racks (KGs)', quantity: 30, price: 45.00 },
      { description: 'Sirloin Bone-in (KGs)', quantity: 60, price: 19.50 },
    ],
    deliveryNote: 'Dock delivery scheduled for 06:00 AM. Requires pallet jack.'
  },
  {
    name: 'Peter Kamau (D001)',
    description: 'Delivery Driver - Nairobi CBD. Vehicle: KDA 123A',
    items: [
      { description: 'Beef Mixed Cuts (KGs)', quantity: 50, price: 800 }
    ],
    deliveryNote: 'ID: D001 | Route: Nairobi CBD | Vehicle: KDA 123A | Contact: 07XX XXX XXX'
  },
  {
    name: 'James Mwangi (D002)',
    description: 'Delivery Driver - Westlands. Vehicle: KDB 456B',
    items: [
      { description: 'Assorted Meats (KGs)', quantity: 30, price: 950 }
    ],
    deliveryNote: 'ID: D002 | Route: Westlands | Vehicle: KDB 456B | Contact: 07XX XXX XXX'
  },
  {
    name: 'Samuel Otieno (D003)',
    description: 'Delivery Driver - Industrial Area. Vehicle: KDC 789C',
    items: [
      { description: 'Industrial Grade Beef (KGs)', quantity: 100, price: 650 }
    ],
    deliveryNote: 'ID: D003 | Route: Industrial Area | Vehicle: KDC 789C | Contact: 07XX XXX XXX'
  },
  {
    name: 'David Kiprono (D004)',
    description: 'Delivery Rider - Kilimani. Vehicle: KMD 112D',
    items: [
      { description: 'Premium Cuts (Small Pack)', quantity: 10, price: 1200 }
    ],
    deliveryNote: 'ID: D004 | Route: Kilimani | Vehicle: KMD 112D | Contact: 07XX XXX XXX'
  },
  {
    name: 'John Kariuki (D005)',
    description: 'Delivery Driver - Eastlands. Vehicle: KDE 223E',
    items: [
      { description: 'Goat Meat (Standard)', quantity: 40, price: 850 }
    ],
    deliveryNote: 'ID: D005 | Route: Eastlands | Vehicle: KDE 223E | Contact: 07XX XXX XXX'
  },
  {
    name: 'Moses Mutua (D006)',
    description: 'Delivery Driver - Thika Road. Vehicle: KDF 334F',
    items: [
      { description: 'Bulk Beef Order (KGs)', quantity: 70, price: 720 }
    ],
    deliveryNote: 'ID: D006 | Route: Thika Road | Vehicle: KDF 334F | Contact: 07XX XXX XXX'
  },
  {
    name: 'Brian Ochieng (D007)',
    description: 'Delivery Rider - Karen. Vehicle: KMG 445G',
    items: [
      { description: 'Lamb & Mutton Cuts (KGs)', quantity: 15, price: 1100 }
    ],
    deliveryNote: 'ID: D007 | Route: Karen | Vehicle: KMG 445G | Contact: 07XX XXX XXX'
  },
  {
    name: 'Daniel Njoroge (D008)',
    description: 'Delivery Driver - Ngong Road. Vehicle: KDH 556H',
    items: [
      { description: 'Mixed Meat Parcel', quantity: 1, price: 15000 }
    ],
    deliveryNote: 'ID: D008 | Route: Ngong Road | Vehicle: KDH 556H | Contact: 07XX XXX XXX'
  },
  {
    name: 'Kevin Wekesa (D009)',
    description: 'Delivery Driver - Mombasa Road. Vehicle: KDJ 667J',
    items: [
      { description: 'Warehouse Supply (Beef)', quantity: 80, price: 680 }
    ],
    deliveryNote: 'ID: D009 | Route: Mombasa Road | Vehicle: KDJ 667J | Contact: 07XX XXX XXX'
  },
  {
    name: 'Joseph Kibet (D010)',
    description: 'Delivery Rider - South B & South C. Vehicle: KMK 778K',
    items: [
      { description: 'Retail Ready Packs', quantity: 20, price: 500 }
    ],
    deliveryNote: 'ID: D010 | Route: South B & South C | Vehicle: KMK 778K | Contact: 07XX XXX XXX'
  }
];
