import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const app = express();
app.use(bodyParser.json());
// 使用它前，先初始化 CORS
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log(__dirname);

app.use("/images", express.static(path.join(__dirname, "../assets")));

app.get("/api/products", async (req, res) => {
  const client = await MongoClient.connect("mongodb://127.0.0.1:27017", {
    useNewUrlParser: true,
  });
  const db = client.db("vue-db");
  const products = await db.collection("products").find({}).toArray();

  res.status(200).json(products);
  client.close();
});

app.get("/api/products/:productId", async (req, res) => {
  const { productId } = req.params;
  const client = await MongoClient.connect("mongodb://127.0.0.1:27017", {
    useNewUrlParser: true,
  });
  const db = client.db("vue-db");
  const product = await db.collection("products").findOne({ id: productId });
  if (product) {
    res.status(200).json(product);
  } else {
    res.status(404).json("Cound not find the product");
  }
  client.close();
});

app.get("/api/users/:userId/cart", async (req, res) => {
  const { userId } = req.params;
  const client = await MongoClient.connect("mongodb://127.0.0.1:27017", {
    useNewUrlParser: true,
  });
  const db = client.db("vue-db");
  const user = await db.collection("users").findOne({ id: userId });
  if (!user) return res.status(404).json("user do not exists");
  const product = await db.collection("products").find({}).toArray();
  const cartItemIds = user.cartItemsId;
  const cartItems = cartItemIds.map((id) =>
    product.find((product) => product.id === id)
  );
  res.status(200).json(cartItems);
  client.close();
});

//添加到购物车
app.post("/api/users/:userId/cart", async (req, res) => {
  const { productId } = req.body;
  const { userId } = req.params;
  const client = await MongoClient.connect("mongodb://127.0.0.1:27017", {
    useNewUrlParser: true,
  });
  const db = client.db("vue-db");
  await db.collection("users").updateOne(
    { id: userId },
    {
      $addToSet: { cartItemsId: productId },
    }
  );
  const user = await db.collection("users").findOne({ id: userId });
  const cartItemIds = user.cartItemsId;
  const products = await db.collection("products").find({}).toArray();
  const cartItems = cartItemIds.map((id) =>
    products.find((product) => product.id === id)
  );

  res.status(200).json(cartItems);
  client.close();
});

app.delete("/api/users/:userId/cart/:productId", async (req, res) => {
  const { productId, userId } = req.params;

  const client = await MongoClient.connect("mongodb://127.0.0.1:27017", {
    useNewUrlParser: true,
  });
  const db = client.db("vue-db");
  await db.collection("users").updateOne(
    { id: userId },
    {
      $pull: { cartItemsId: productId },
    }
  );
  const user = await db.collection("users").findOne({ id: userId });
  const cartItemIds = user.cartItemsId;
  const products = await db.collection("products").find({}).toArray();
  const cartItems = cartItemIds.map((id) =>
    products.find((product) => product.id === id)
  );
  res.status(200).json(cartItems);
  client.close();
});

app.listen(8000, () => {
  console.log("listening");
});
