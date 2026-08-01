import { db } from "./db";
import { productsTable, salesTable } from "./schema";
import { eq } from "drizzle-orm";

const products = [
  { name: "Laptop", category: "Electronics", price: 999.99, stock: 80 },
  { name: "Gaming Laptop", category: "Electronics", price: 1599.99, stock: 50 },
  { name: "Mouse", category: "Electronics", price: 29.99, stock: 250 },
  { name: "Keyboard", category: "Electronics", price: 79.99, stock: 180 },
  { name: "Monitor", category: "Electronics", price: 349.99, stock: 120 },
  { name: "Desk Chair", category: "Furniture", price: 219.99, stock: 70 },
  { name: "Standing Desk", category: "Furniture", price: 499.99, stock: 40 },
  { name: "Bookshelf", category: "Furniture", price: 149.99, stock: 90 },
  { name: "Notebook", category: "Stationery", price: 5.99, stock: 1000 },
  { name: "Pen Set", category: "Stationery", price: 12.99, stock: 600 },
  { name: "Printer", category: "Electronics", price: 189.99, stock: 60 },
  { name: "Headphones", category: "Electronics", price: 149.99, stock: 150 },
  { name: "Speaker", category: "Electronics", price: 89.99, stock: 160 },
  { name: "SSD 1TB", category: "Electronics", price: 119.99, stock: 140 },
  { name: "USB Drive", category: "Electronics", price: 24.99, stock: 500 },
  { name: "Coffee Mug", category: "Kitchen", price: 14.99, stock: 350 },
  { name: "Water Bottle", category: "Kitchen", price: 19.99, stock: 280 },
  { name: "Backpack", category: "Accessories", price: 59.99, stock: 200 },
  { name: "Smart Watch", category: "Electronics", price: 299.99, stock: 90 },
  { name: "Phone Stand", category: "Accessories", price: 18.99, stock: 350 },
  { name: "Tablet", category: "Electronics", price: 649.99, stock: 70 },
  { name: "Office Lamp", category: "Furniture", price: 45.99, stock: 120 },
  { name: "HDMI Cable", category: "Electronics", price: 15.99, stock: 600 },
  { name: "Webcam", category: "Electronics", price: 89.99, stock: 120 },
  { name: "Microphone", category: "Electronics", price: 129.99, stock: 100 },
  { name: "Router", category: "Electronics", price: 139.99, stock: 110 },
  { name: "External HDD", category: "Electronics", price: 99.99, stock: 130 },
  { name: "Office Chair Premium", category: "Furniture", price: 399.99, stock: 45 },
  { name: "Mechanical Keyboard", category: "Electronics", price: 129.99, stock: 100 },
  { name: "Graphics Tablet", category: "Electronics", price: 249.99, stock: 55 },
];

const firstNames = [
  "John","Jane","Alice","Bob","Charlie","David","Emma","Sophia","Liam",
  "Olivia","Noah","Ava","James","Lucas","Ethan","Mia","Charlotte","Henry",
  "Benjamin","Daniel","Isabella","Harper","Grace","Jack","Leo","William",
  "Elijah","Michael","Emily","Amelia"
];

const lastNames = [
  "Smith","Johnson","Brown","Davis","Wilson","Taylor","Anderson","Thomas",
  "Moore","Jackson","White","Martin","Lee","Clark","Lewis","Walker",
  "Hall","Allen","Young","King"
];

const regions = [
  "North",
  "South",
  "East",
  "West",
  "Central"
];

function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateWithinYear() {
  const today = new Date();

  const past = new Date(
    today.getTime() -
      random(0, 365) * 24 * 60 * 60 * 1000 -
      random(0, 86400) * 1000
  );

  return past.toISOString().slice(0, 19).replace("T", " ");
}

function customerName() {
  return `${firstNames[random(0, firstNames.length - 1)]} ${
    lastNames[random(0, lastNames.length - 1)]
  }`;
}

async function seed() {
  console.log("Cleaning database...");

  await db.delete(salesTable);
  await db.delete(productsTable);

  console.log("Inserting products...");

  await db.insert(productsTable).values(products);

  console.log("Generating sales...");

  const sales = [];

  for (let i = 0; i < 5000; i++) {
    const product = products[random(0, products.length - 1)];

    const qty = random(1, 8);

    const priceVariation =
      product.price * (0.95 + Math.random() * 0.1);

    sales.push({
      product_id: random(1, products.length),
      quantity: qty,
      total_amount: Number((qty * priceVariation).toFixed(2)),
      customer_name: customerName(),
      region: regions[random(0, regions.length - 1)],
      sale_date: randomDateWithinYear(),
    });
  }

  console.log("Inserting 5000 sales...");

  const chunk = 500;

  for (let i = 0; i < sales.length; i += chunk) {
    await db.insert(salesTable).values(
      sales.slice(i, i + chunk)
    );
  }

  console.log("Updating stock...");

  for (let id = 1; id <= products.length; id++) {
    await db.update(productsTable)
      .set({
        stock: random(20, 500)
      })
      .where(eq(productsTable.id, id));
  }

  console.log("Done!");
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });