const DECKS = {
    places: {
        id: 'places',
        name: 'Random Places',
        icon: '🗺️',
        tagline: 'Famous landmarks, everyday spots & adventures',
        badge: 'Popular',
        color: '#FF9900',
        cards: [
            'Eiffel Tower', 'Airport', 'Taj Mahal', 'Movie Theater', 'Grand Canyon',
            'Camping Site', 'Hospital', 'Public Library', 'Sandy Beach', 'Amusement Park',
            'Tokyo', 'Space Station', 'Fitness Gym', 'Train Station', 'City Zoo',
            'Supermarket', 'Sahara Desert', 'Prison', 'Medieval Castle', 'Cruise Ship',
            'Niagara Falls', 'Volcano', 'Subway Station', 'High School', 'Luxury Hotel',
            'Bank Vault', 'Bakery', 'Art Museum', 'Sports Stadium', 'Fire Station',
            'Bowling Alley', 'Barn & Farm', 'Water Park', 'Police Station', 'Coffee Shop',
            'Casino', 'Post Office', 'Aquarium', 'Pyramids of Giza', 'Treehouse',
            'Shopping Mall', 'Car Wash', 'Ice Skating Rink', 'Gas Station', 'Lighthouse'
        ]
    },
    food: {
        id: 'food',
        name: 'Food & Treats',
        icon: '🍕',
        tagline: 'Delicious snacks, classic dishes & desserts',
        badge: 'Fun',
        color: '#FF9900',
        cards: [
            'Pepperoni Pizza', 'Ice Cream Cone', 'Sushi Roll', 'Crispy Taco', 'Chocolate Bar',
            'Pancake Stack', 'Cheeseburger', 'French Fries', 'Glazed Donut', 'Movie Popcorn',
            'Spaghetti & Meatballs', 'Watermelon', 'Hot Dog', 'Cotton Candy', 'Club Sandwich',
            'Belgian Waffles', 'Breakfast Burrito', 'Cheesecake', 'Butter Croissant', 'Chocolate Milkshake',
            'Fried Chicken', 'Guacamole & Chips', 'Apple Pie', 'Loaded Nachos', 'Ramen Noodles',
            'Strawberry Cupcake', 'Cheesy Lasagna', 'Potato Chips', 'Garlic Bread', 'Fudge Brownie',
            'Mac and Cheese', 'BBQ Ribs', 'Fresh Mango', 'Cheese Omelet', 'Salted Pretzel',
            'Fruit Smoothie', 'Caesar Salad', 'Toasted Marshmallow', 'Crispy Onion Rings', 'Toasted Bagel',
            'Cinnamon Churros', 'Steamed Dumplings', 'Pecan Pie', 'Tomato Soup', 'Avocado Toast'
        ]
    },
    tech: {
        id: 'tech',
        name: 'Tech',
        icon: '💻',
        tagline: 'Everyday gadgets, apps & simple tech',
        badge: 'Tech',
        color: '#FF9900',
        cards: [
            'WiFi', 'iPhone', 'Computer Mouse', 'Robot', 'Laptop',
            'Headphones', 'Google', 'Password', 'Camera', 'Drone',
            'Smartwatch', 'Netflix', 'Video Game', 'Phone Charger', 'Keyboard',
            'YouTube', 'Selfie Stick', 'Smile Emoji', 'Microphone', 'Tablet iPad',
            'Power Bank', 'Calculator', 'Printer', 'Zoom Call', 'Smart TV',
            'Flashlight', 'Bluetooth', 'Battery', 'Speaker', 'Touchscreen',
            'App Store', 'Game Controller', 'Wireless Earbuds', 'QR Code', 'Screen',
            'Computer', 'Webcam', 'Email', 'Internet', 'TikTok',
            'Instagram', 'USB Drive', 'GPS', 'Chatbot', 'Smart Glasses'
        ]
    },
    animals: {
        id: 'animals',
        name: 'Basic Animals',
        icon: '🦁',
        tagline: 'Wild beasts, friendly pets & sea creatures',
        badge: 'Classic',
        color: '#FF9900',
        cards: [
            'Lion', 'Penguin', 'Elephant', 'Kangaroo', 'Monkey',
            'Dolphin', 'Giraffe', 'Puppy Dog', 'Giant Panda', 'Night Owl',
            'Snake', 'Tree Frog', 'Bengal Tiger', 'Fluffy Rabbit', 'Great White Shark',
            'Koala Bear', 'Zebra', 'Desert Camel', 'Gorilla', 'Pink Flamingo',
            'Crocodile', 'Wild Horse', 'Cat Kitten', 'Grizzly Bear', 'Bald Eagle',
            'Talking Parrot', 'Octopus', 'Blue Whale', 'Red Fox', 'Rubber Duck',
            'Timber Wolf', 'Nutty Squirrel', 'Speedy Cheetah', 'Mountain Goat', 'Hippopotamus',
            'Monarch Butterfly', 'Flying Bat', 'Raccoon', 'Peacock', 'Sea Lion Seal',
            'Sea Turtle', 'Fluffy Sheep', 'Hamster Wheel', 'Giant Lobster', 'Lazy Sloth'
        ]
    },
    mix: {
        id: 'mix',
        name: 'Club All-In-One Mix',
        icon: '🎯',
        tagline: 'A wild mashup of places, food, tech & animals',
        badge: 'Special',
        color: '#FF9900',
        cards: []
    }
};

DECKS.mix.cards = [
    ...DECKS.places.cards,
    ...DECKS.food.cards,
    ...DECKS.tech.cards,
    ...DECKS.animals.cards
];
