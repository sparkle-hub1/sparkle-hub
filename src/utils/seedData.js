import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const seedProductsIfEmpty = async () => {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    
    // Auto-seed only if collection is empty
    if (snapshot.empty) {
      console.log('Product collection is empty. Seeding dummy data...');
      
      const dummyProducts = [
        { name: 'Nebula Watch', price: 299, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1000&h=1000', description: 'A premium smart watch crafted with cosmic precision. Features a beautiful OLED display and a 7-day battery life.', category: 'Electronics', variations: ['Silver', 'Black', 'Rose Gold'] },
        { name: 'Aero Headphones', price: 199, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1000&h=1000', description: 'Noise-cancelling wireless headphones for true audiophiles. Experience music like never before with deep bass.', category: 'Audio', variations: ['Matte Black', 'White', 'Navy'] },
        { name: 'Lumina Keyboard', price: 149, image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=1000&h=1000', description: 'Mechanical keyboard with dynamic RGB backlighting and aircraft-grade aluminum frame.', category: 'Accessories', variations: ['Blue Switches', 'Red Switches', 'Brown Switches'] },
        { name: 'Aura Desk Lamp', price: 89, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=1000&h=1000', description: 'Modern smart lamp with adjustable color temperature and brightness control from your phone.', category: 'Home', variations: ['Standard'] },
        { name: 'Vortex Speaker', price: 129, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=1000&h=1000', description: '360 degree surround sound portable speaker. Waterproof and incredibly loud.', category: 'Audio', variations: ['Charcoal', 'Mint'] },
        { name: 'Titan Backpack', price: 119, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=1000&h=1000', description: 'Waterproof luxury backpack with dedicated compartments for your laptop and gadgets.', category: 'Accessories', variations: ['Navy', 'Olive', 'Black'] },
      ];

      for (const product of dummyProducts) {
        await addDoc(productsRef, product);
      }
      console.log('Database seeded successfully!');
    }
  } catch (err) {
    console.error('Error seeding data:', err);
  }
};
