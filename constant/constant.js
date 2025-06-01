const CHEF_DATA = [
    { chefName: 'Manesh', isAdmin: true },
    { chefName: 'Pritam', isAdmin: false },
    { chefName: 'Yash', isAdmin: false },
    { chefName: 'Tenzen', isAdmin: false },
]
const CATEGORY_DATA = [
    { name: 'All', icon: 'burger.svg' },
    { name: 'Burger', icon: 'burger.svg' },
    { name: 'Pizza', icon: 'pizza.svg' },
    { name: 'Drink', icon: 'drink.svg' },
    { name: 'French Fries', icon: 'french fries.svg' },
    { name: 'Veggies', icon: 'veggies.svg' }
]
const MENU_ITEMS = [
    {
        itemName: "Capricciosa",
        itemPrice: 200,
        itemImage: 'Capricciosa.svg',
        description: "Italian pizza with mushrooms, olives, artichokes, and ham.",
        preparationTime: 20,
        tax: 10,
        categoryId: "Pizza"
    },
    {
        itemName: "Sicilian",
        itemPrice: 150,
        itemImage: 'Sicilian.svg',
        description: "Square, thick-crust pizza with tomato sauce and herbs.",
        preparationTime: 22,
        tax: 7.5,
        categoryId: "Pizza"
    },
    {
        itemName: "Marinara",
        itemPrice: 90,
        itemImage: 'Marinara.svg',
        description: "Simple pizza with tomato, garlic, oregano, and olive oil.",
        preparationTime: 15,
        tax: 4.5,
        categoryId: "Pizza"
    },
    {
        itemName: "Pepperoni",
        itemPrice: 300,
        itemImage: 'Pepperoni.svg',
        description: "Loaded pepperoni pizza with mozzarella and tomato sauce.",
        preparationTime: 18,
        tax: 15,
        categoryId: "Pizza"
    },
    {
        itemName: "Marinara",
        itemPrice: 200,
        itemImage: 'Marinara-2.svg',
        description: "Richer Marinara with extra herbs and crispy thin crust.",
        preparationTime: 17,
        tax: 10,
        categoryId: "Pizza"
    },
    {
        itemName: "Pepperoni",
        itemPrice: 200,
        itemImage: 'Pepperoni-2.svg',
        description: "Classic pepperoni pizza with a soft crust and spicy meat.",
        preparationTime: 16,
        tax: 10,
        categoryId: "Pizza"
    },
    {
        itemName: "Classic Burger",
        itemPrice: 120,
        itemImage: 'Capricciosa.svg',
        description: "Juicy grilled patty with lettuce, tomato, and mayo in a sesame bun.",
        preparationTime: 12,
        tax: 6,
        categoryId: "Burger"
    },
    {
        itemName: "Lemon Iced Tea",
        itemPrice: 60,
        itemImage: 'Pepperoni-2.svg',
        description: "Refreshing iced tea with a splash of lemon, served chilled.",
        preparationTime: 3,
        tax: 3,
        categoryId: "Drink"
    },
    {
        itemName: "Cheesy Fries",
        itemPrice: 90,
        itemImage: 'Sicilian.svg',
        description: "Crispy golden fries loaded with melted cheese and seasoning.",
        preparationTime: 7,
        tax: 4.5,
        categoryId: "French Fries"
    }
];


export default {
    CHEF_DATA,
    CATEGORY_DATA,
    MENU_ITEMS
}