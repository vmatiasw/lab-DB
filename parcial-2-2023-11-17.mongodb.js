// 1. Buscar las ventas realizadas en "London", "Austin" o "San Diego";
// a un customer con edad mayor-igual a 18 años que tengan productos
// que hayan salido al menos 1000 y estén etiquetados (tags) como de
// tipo "school" o "kids" (pueden tener más etiquetas).
// Mostrar el id de la venta con el nombre "sale", la fecha ("saleDate"),
// el storeLocation, y el "email del cliente. No mostrar resultados
// anidados.

db.getCollectionNames();

db.storeObjectives.findOne();
db.sales.findOne();

db.sales.aggregate([
  //   {
  //     $lookup: {
  //       from: "storeObjectives",
  //       localField: "storeLocation",
  //       foreignField: "_id",
  //       as: "storeObjectives",
  //     },
  //   },
  {
    $match: {
      $and: [
        {
          storeLocation: {
            $in: ["London", "Austin", "San Diego"],
          },
        },
        { "items.tags": { $in: ["school", "kids"] } },
        { "items.price": { $gte: 1000 } },
        { "customer.age": { $gte: 18 } },
      ],
    },
  },
  {
    $project: {
      sale: "$_id",
      saleDate: 1,
      storeLocation: 1,
      "customer.email": 1,
    },
  },
]);

// 2. Buscar las ventas de las tiendas localizadas en
// Seattle, donde el método de compra
// sea 'In store" o 'Phone' y se hayan realizado entre
// 1 de febrero de 2014 y 31 de enero
// de 2015 (ambas fechas inclusive). Listar el email
// y la satisfacción del cliente, y el
// monto total facturado, donde el monto de cada item
// se calcula como 'price *
// quantity'. Mostrar el resultado ordenados por
// satisfacción (descendente), frente a
// empate de satisfacción ordenar por email (alfabético).

db.sales.aggregate([
  {
    $match: {
      $and: [
        { storeLocation: "Seattle" },
        { purchaseMethod: { $in: ["In store", "Phone"] } },
        {
          saleDate: {
            $gte: ISODate("2014-02-01T00:00:00.000Z"),
            $lte: ISODate("2015-01-31T00:00:00.000Z"),
          },
        },
      ],
    },
  },
  {
    $project: {
      "customer.email": 1,
      "customer.satisfaction": 1,
      monto_total: {
        $sum: {
          $map: {
            input: "$items",
            as: "item",
            in: { $multiply: ["$$item.price", "$$item.quantity"] },
          },
        },
      },
    },
  },
  {
    $sort: {
      "customer.satisfaction": -1,
      "customer.email": 1,
    },
  },
]);

// Crear la vista salesinvoiced que calcula el monto
// mínimo, monto máximo, monto
// total y monto promedio facturado por año y mes.
// Mostrar el resultado en orden
// cronológico. No se debe mostrar campos anidados
// en el resultado.

db.sales.findOne();

db.createView("salesinvoiced", "sales", [
  {
    $unwind: {
      path: "$items",
      preserveNullAndEmptyArrays: false,
    },
  },
  {
    $group: {
      _id: {
        year: { $year: "$saleDate" },
        month: { $month: "$saleDate" },
      },
      sumPorMes: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      max_total: { $max: { $multiply: ["$items.price", "$items.quantity"] } },
      min_total: { $min: { $multiply: ["$items.price", "$items.quantity"] } },
      count: { $sum: 1 },
    },
  },
  {
    $project: {
      promedioPorMes: { $divide: ["$sumPorMes", "$count"] },
      max_total: 1,
      min_total: 1,
      sumPorMes: 1,
    },
  },
]);

db.salesinvoiced.findOne();

db.sales.aggregate([
  {
    $unwind: {
      path: "$items",
      preserveNullAndEmptyArrays: false,
    },
  },
  {
    $group: {
      _id: {
        year: { $year: "$saleDate" },
        month: { $month: "$saleDate" },
      },
      sumPorMes: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      max_total: { $max: { $multiply: ["$items.price", "$items.quantity"] } },
      min_total: { $min: { $multiply: ["$items.price", "$items.quantity"] } },
      count: { $sum: 1 },
    },
  },
  {
    $project: {
      promedioPorMes: { $divide: ["$sumPorMes", "$count"] },
      max_total: 1,
      min_total: 1,
      sumPorMes: 1,
    },
  },
]);

// {
//     $project: {
//       // Aplano el array de arrays de objs
//       // en un solo array de objs
//       items: {
//         $reduce: {
//           input: "$items",
//           initialValue: [],
//           in: { $concatArrays: ["$$value", "$$this"] },
//         },
//       },
//     },
//   },

// 4. Mostrar el storeLocation, la venta promedio de
// ese local, el objetivo a cumplir de
// ventas (dentro de la colección storeObjectives)
// y la diferencia entre el promedio y el
// objetivo de todos los locales.

db.sales.aggregate([
  {
    $lookup: {
      from: "storeObjectives",
      localField: "storeLocation",
      foreignField: "_id",
      as: "so",
    },
  },
  {
    $project: {
      avg: {
        $avg: {
          $map: {
            input: "$items",
            as: "item",
            in: { $multiply: ["$$item.price", "$$item.quantity"] },
          },
        },
      },
      objective: { $arrayElemAt: ["$so.objective", 0] },
    },
  },
  {
    $project: {
      avg: 1,
      objective: 1,
      diff: { $abs: { $subtract: ["$objective", "$avg"] } },
    },
  },
]);

// 5. Especificar reglas de validación en la colección
// sales utilizando JSON Schema.

// a. Las reglas se deben aplicar sobre los campos:
// saleDate, storeLocation,
// purchaseMethod, y customer ( y todos sus campos
// anidados ). Inferir los
// tipos y otras restricciones que considere
// adecuados para especificar las
// reglas a partir de los documentos de la colección.

// b. Para testear las reglas de validación crear
// un caso de falla en la regla de
// validación y un caso de éxito (Indicar si es
// caso de falla o éxito)
db.sales.findOne();
db.runCommand({
  collMod: "sales",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["saleDate", "storeLocation", "purchaseMethod", "customer"],
      properties: {
        saleDate: { bsonType: "date" },
        storeLocation: { bsonType: "string" },
        purchaseMethod: { bsonType: "string" },
        customer: {
          bsonType: "object",
          required: ["gender", "age", "email", "satisfaction"],
          properties: {
            gender: { bsonType: "string" },
            age: { bsonType: "int" },
            email: { bsonType: "string" },
            satisfaction: { bsonType: "int" },
          },
        },
      },
    },
  },
  validationLevel: "moderate",
  validationAction: "error",
});

db.sales.insertOne({ // Este si va
  saleDate: ISODate("2014-02-01T00:00:00.000Z"),
  storeLocation: "Denver",
  purchaseMethod: "Online",
  customer: {
    gender: "M",
    age: 52,
    email: "cauho@witwuta.sv",
    satisfaction: 4,
  },
});

db.sales.insertOne({ // Este no va
  saleDate: "2014-02-01T00:00:00.000Z",
  storeLocation: "Denver",
  purchaseMethod: "Online",
  customer: {
    gender: "M",
    age: 52,
    email: "cauho@witwuta.sv",
    satisfaction: 4,
  },
});
