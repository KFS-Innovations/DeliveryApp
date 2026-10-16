import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
export const CATEGORY_ITEM_WIDTH = (width - 30) / 4; 

export const COLORS = {
  primary: '#22C55E',      
  backgroundEnd: '#FDFDFD',   
  surface: '#F8FAFC',      
  textDark: '#111827',     
  textMuted: '#6B7280',    
  cardBg: '#FFFFFF',
  badgeBg: '#FFFFFF',
  heartIcon: '#F3705A',    
  heartBg: '#FFF0ED',      
  starGold: '#FFC107',
  deliveryPromo: '#E3825E', 
  priceBg: '#000000',      
  catActiveBg: '#FF5722',   
  catInactiveBg: '#111827', 
};

export const CATEGORIES = [
  { id: '0', name: 'All', icon: '🍽️' }, // Added so users can clear the filter
  { id: '1', name: 'Veg', icon: '🥬' },
  { id: '2', name: 'Dairy', icon: '🥛' },
  { id: '3', name: 'Fruits', icon: '🍎' },
  { id: '4', name: 'Coconut', icon: '🥥' },
  { id: '5', name: 'Meat', icon: '🥩' }, // Updated icon to meat instead of a pepper
  { id: '6', name: 'Fish', icon: '🐟' },
  { id: '7', name: 'More', icon: '📦' },
];